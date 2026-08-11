mod context;
mod hooks;
mod models;
mod orchestrator;

use serde::Serialize;
use sha2::{Digest, Sha256};

pub use models::{AgentRuntimeError, ExecutionControl, ExecutionReceipt, RunRequest, RunResult};
pub use orchestrator::run_synthetic;

pub(crate) fn canonical_digest(value: &impl Serialize) -> Result<String, AgentRuntimeError> {
    let bytes = serde_json::to_vec(value)
        .map_err(|error| AgentRuntimeError::Serialization(error.to_string()))?;
    let digest = Sha256::digest(bytes);
    let encoded: String = digest.iter().map(|byte| format!("{byte:02x}")).collect();
    Ok(format!("sha256:{encoded}"))
}

pub fn verify_receipt(receipt: &ExecutionReceipt) -> Result<bool, AgentRuntimeError> {
    let expected = receipt.receipt_digest.clone();
    let mut preimage = receipt.clone();
    preimage.receipt_digest.clear();
    Ok(canonical_digest(&preimage)? == expected)
}

#[cfg(test)]
mod tests {
    use crate::contracts::agent_runtime_generated::{
        HookOutcome, HookPoint, LifecyclePhase, LifecycleScope,
    };

    use super::hooks::{HookRegistry, SyntheticHookHandler};
    use super::models::{
        AgentRuntimeError, Disclosure, ExecutionControl, HookRegistration, RunRequest,
    };
    use super::{run_synthetic, verify_receipt};

    const FIXTURE: &str = include_str!(
        "../../../contracts/agent-runtime/fixtures/valid/synthetic-supervisor-run.json"
    );

    fn request() -> RunRequest {
        serde_json::from_str(FIXTURE).expect("synthetic run fixture must deserialize")
    }

    #[test]
    fn disabled_runtime_rejects_before_event_creation() {
        let mut request = request();
        request.policy.enabled = false;
        let error = run_synthetic(&request, &ExecutionControl::default())
            .expect_err("disabled runtime must reject");
        assert_eq!(error, AgentRuntimeError::Disabled);
        assert_eq!(error.code(), "E_AGENT_RUNTIME_DISABLED");
    }

    #[test]
    fn synthetic_run_is_deterministic_and_structured() {
        let request = request();
        let first =
            run_synthetic(&request, &ExecutionControl::default()).expect("synthetic run must pass");
        let second = run_synthetic(&request, &ExecutionControl::default())
            .expect("synthetic replay must pass");
        assert_eq!(first, second);
        assert_eq!(first.status, "completed");
        assert_eq!(first.node_results.len(), 3);
        assert_eq!(first.receipt.node_count, 3);
        assert_eq!(first.receipt.event_count, first.events.len());
        assert!(!first.receipt.network);
        assert!(!first.receipt.provider);
        assert!(!first.receipt.credentials);
        assert!(!first.receipt.private_context);
        assert!(!first.receipt.verified);
        assert_eq!(first.memory_checkpoint.status, "candidate");
        assert!(!first.memory_checkpoint.admitted);
        assert_eq!(
            first.receipt.memory_checkpoint_digest,
            first.memory_checkpoint.checkpoint_digest
        );
        assert!(first.receipt.receipt_digest.starts_with("sha256:"));
        assert!(verify_receipt(&first.receipt).expect("receipt verification must run"));
        let mut tampered = first.receipt.clone();
        tampered.node_count += 1;
        assert!(!verify_receipt(&tampered).expect("tamper verification must run"));
        for (index, event) in first.events.iter().enumerate() {
            assert_eq!(event.sequence, index as u64 + 1);
            if index > 0 {
                assert_eq!(
                    event.causation_id.as_deref(),
                    Some(first.events[index - 1].event_id.as_str())
                );
            }
        }
    }

    #[test]
    fn context_compiler_preserves_hierarchy_not_fixture_order() {
        let result = run_synthetic(&request(), &ExecutionControl::default())
            .expect("synthetic run must pass");
        let ids: Vec<_> = result
            .context
            .included
            .iter()
            .map(|entry| entry.source_id.as_str())
            .collect();
        assert_eq!(
            ids,
            vec![
                "operational-charter",
                "synthetic-archetype",
                "project-agents",
                "task-packet"
            ]
        );
        assert!(result.context.omitted.is_empty());
    }

    #[test]
    fn optional_restricted_context_is_omitted_with_a_receipt() {
        let mut request = request();
        let source = &mut request.context.sources[1];
        source.sensitivity = Disclosure::Restricted;
        source.required = false;
        let result = run_synthetic(&request, &ExecutionControl::default())
            .expect("optional restricted source must be omitted");
        assert!(result
            .context
            .omitted
            .iter()
            .any(|entry| entry.source_id == "project-agents" && entry.outcome == "excluded"));
    }

    #[test]
    fn stale_required_context_fails_closed() {
        let mut request = request();
        request.context.sources[0].freshness = "stale".to_owned();
        let error = run_synthetic(&request, &ExecutionControl::default())
            .expect_err("stale required source must fail");
        assert_eq!(error.code(), "E_CONTEXT_INVALID");
    }

    #[test]
    fn child_capability_escalation_fails_closed() {
        let mut request = request();
        request.agent.orchestration.nodes[1]
            .capabilities
            .push("hosted-search".to_owned());
        let error = run_synthetic(&request, &ExecutionControl::default())
            .expect_err("capability escalation must fail");
        assert_eq!(error.code(), "E_CHILD_CAPABILITY_ESCALATION");
    }

    #[test]
    fn orchestration_dependency_cycle_fails_closed() {
        let mut request = request();
        request.agent.orchestration.nodes[1]
            .depends_on
            .push("critic".to_owned());
        let error = run_synthetic(&request, &ExecutionControl::default())
            .expect_err("dependency cycle must fail");
        assert_eq!(error.code(), "E_DEPENDENCY_CYCLE");
    }

    #[test]
    fn cancellation_propagates_to_terminal_run_event() {
        let control = ExecutionControl {
            cancel_before_node: Some("critic".to_owned()),
        };
        let result =
            run_synthetic(&request(), &control).expect("cancellation is a terminal result");
        assert_eq!(result.status, "cancelled");
        assert_eq!(result.node_results.len(), 1);
        let final_event = result.events.last().expect("terminal event exists");
        assert_eq!(final_event.scope, LifecycleScope::Run);
        assert_eq!(final_event.phase, LifecyclePhase::Cancelled);
        assert_eq!(result.receipt.status, "cancelled");
    }

    #[test]
    fn hook_registry_supports_all_typed_outcomes_in_deterministic_order() {
        let base = request().policy.hooks[0].clone();
        let cases = [
            ("hook-continue", HookOutcome::Continue),
            ("hook-append", HookOutcome::Append),
            ("hook-patch", HookOutcome::Patch),
            ("hook-block", HookOutcome::Block),
            ("hook-retry", HookOutcome::Retry),
            ("hook-redirect", HookOutcome::Redirect),
            ("hook-suspend", HookOutcome::Suspend),
            ("hook-terminate", HookOutcome::Terminate),
        ];
        let registrations: Vec<HookRegistration> = cases
            .iter()
            .enumerate()
            .rev()
            .map(|(index, (id, outcome))| {
                let mut registration = base.clone();
                registration.hook_id = (*id).to_owned();
                registration.scope = LifecycleScope::Run;
                registration.point = HookPoint::Before;
                registration.priority = index as u32;
                registration.dependencies = Vec::new();
                registration.allowed_outcomes = vec![*outcome];
                registration
            })
            .collect();
        let registry = HookRegistry::new(registrations).expect("hook registry must validate");
        let interventions = registry
            .invoke(
                LifecycleScope::Run,
                HookPoint::Before,
                &SyntheticHookHandler,
            )
            .expect("typed hook outcomes must run");
        let outcomes: Vec<_> = interventions
            .iter()
            .map(|intervention| intervention.outcome)
            .collect();
        assert_eq!(
            outcomes,
            vec![
                HookOutcome::Continue,
                HookOutcome::Append,
                HookOutcome::Patch,
                HookOutcome::Block,
                HookOutcome::Retry,
                HookOutcome::Redirect,
                HookOutcome::Suspend,
                HookOutcome::Terminate,
            ]
        );
    }

    #[test]
    fn hook_dependency_cycle_and_patch_conflict_fail_closed() {
        let base = request().policy.hooks[0].clone();
        let mut first = base.clone();
        first.hook_id = "hook-patch-first".to_owned();
        first.scope = LifecycleScope::Run;
        first.point = HookPoint::Before;
        first.allowed_outcomes = vec![HookOutcome::Patch];
        first.dependencies = vec!["hook-patch-second".to_owned()];
        let mut second = first.clone();
        second.hook_id = "hook-patch-second".to_owned();
        second.dependencies = vec!["hook-patch-first".to_owned()];
        let cycle = HookRegistry::new(vec![first.clone(), second.clone()])
            .expect_err("hook dependency cycle must fail");
        assert_eq!(cycle.code(), "E_HOOK_DEPENDENCY");

        first.dependencies.clear();
        second.dependencies.clear();
        let registry = HookRegistry::new(vec![first, second]).expect("independent hooks validate");
        let conflict = registry
            .invoke(
                LifecycleScope::Run,
                HookPoint::Before,
                &SyntheticHookHandler,
            )
            .expect_err("exclusive patch conflict must fail");
        assert_eq!(conflict.code(), "E_HOOK_CONFLICT");
    }

    #[test]
    fn structured_fixture_round_trips_without_unknown_fields() {
        let request = request();
        let encoded = serde_json::to_string(&request).expect("run request must serialize");
        let decoded: RunRequest =
            serde_json::from_str(&encoded).expect("run request must deserialize");
        assert_eq!(request, decoded);
    }
}
