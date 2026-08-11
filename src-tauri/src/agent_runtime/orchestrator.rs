use std::collections::{BTreeMap, BTreeSet};

use serde_json::{json, Value};

use crate::contracts::agent_runtime_generated::{
    HookOutcome, HookPoint, LifecyclePhase, LifecycleScope, AGENT_RUNTIME_SOURCE_DIGEST,
    AGENT_RUNTIME_SOURCE_ID,
};

use super::canonical_digest;
use super::context::compile_context;
use super::hooks::{HookRegistry, SyntheticHookHandler};
use super::models::{
    AgentRuntimeError, Disclosure, ExecutionControl, ExecutionReceipt, LifecycleEvent,
    MemoryCheckpoint, NodeResult, OrchestrationNode, RunRequest, RunResult,
};

struct EventLedger<'a> {
    request: &'a RunRequest,
    events: Vec<LifecycleEvent>,
}

impl<'a> EventLedger<'a> {
    fn new(request: &'a RunRequest) -> Self {
        Self {
            request,
            events: Vec::new(),
        }
    }

    fn emit(
        &mut self,
        scope: LifecycleScope,
        phase: LifecyclePhase,
        actor: &str,
        payload_contract: &str,
        payload: &Value,
    ) -> Result<(), AgentRuntimeError> {
        let payload_digest = canonical_digest(payload)?;
        let sequence = self.events.len() as u64 + 1;
        let event_id = format!("event-{sequence}-{}", &payload_digest[7..23]);
        let causation_id = self.events.last().map(|event| event.event_id.clone());
        self.events.push(LifecycleEvent {
            schema: "exocore.agent-runtime.event.v1".to_owned(),
            event_id,
            session_id: self.request.session.session_id.clone(),
            root_run_id: self.request.session.root_run_id.clone(),
            run_id: self.request.run_id.clone(),
            parent_run_id: self.request.session.parent_run_id.clone(),
            correlation_id: self.request.session.correlation_id.clone(),
            causation_id,
            sequence,
            scope,
            phase,
            actor: actor.to_owned(),
            source_module: "agent-runtime".to_owned(),
            visibility: Disclosure::PublicSafe,
            payload_contract: payload_contract.to_owned(),
            payload_digest,
        });
        Ok(())
    }
}

fn validate_provider(request: &RunRequest) -> Result<(), AgentRuntimeError> {
    if request.model.provider != "deterministic-synthetic" {
        return Err(AgentRuntimeError::InvalidContext(
            "only deterministic-synthetic provider is admitted".to_owned(),
        ));
    }
    let constraints = &request.model.provider_constraints;
    if constraints.network
        || constraints.credentials
        || constraints.retained_state
        || constraints.fallback
    {
        return Err(AgentRuntimeError::InvalidContext(
            "synthetic provider cannot request effects".to_owned(),
        ));
    }
    Ok(())
}

fn validate_attenuation(request: &RunRequest) -> Result<(), AgentRuntimeError> {
    let allowed_capabilities: BTreeSet<_> = request.model.required_capabilities.iter().collect();
    let allowed_tools: BTreeSet<_> = request.tools.allow.iter().collect();
    let allowed_effects: BTreeSet<_> = request.tools.effects.iter().collect();
    for node in &request.agent.orchestration.nodes {
        if !node
            .capabilities
            .iter()
            .all(|capability| allowed_capabilities.contains(capability))
        {
            return Err(AgentRuntimeError::CapabilityEscalation(
                node.node_id.clone(),
            ));
        }
        if !node.tools.iter().all(|tool| allowed_tools.contains(tool)) {
            return Err(AgentRuntimeError::ToolEscalation(node.node_id.clone()));
        }
        if !node
            .effects
            .iter()
            .all(|effect| allowed_effects.contains(effect))
        {
            return Err(AgentRuntimeError::EffectEscalation(node.node_id.clone()));
        }
        if node.disclosure > request.context.disclosure {
            return Err(AgentRuntimeError::DisclosureEscalation(
                node.node_id.clone(),
            ));
        }
        if node.budget > request.policy.max_turns {
            return Err(AgentRuntimeError::CapabilityEscalation(format!(
                "{} exceeds parent turn budget",
                node.node_id
            )));
        }
    }
    let child_count = request.agent.orchestration.nodes.len().saturating_sub(1);
    if child_count > request.policy.max_concurrent_children as usize {
        return Err(AgentRuntimeError::CapabilityEscalation(
            "child concurrency exceeds parent budget".to_owned(),
        ));
    }
    Ok(())
}

fn topological_nodes(
    nodes: &[OrchestrationNode],
) -> Result<Vec<OrchestrationNode>, AgentRuntimeError> {
    let by_id: BTreeMap<_, _> = nodes
        .iter()
        .cloned()
        .map(|node| (node.node_id.clone(), node))
        .collect();
    if by_id.len() != nodes.len() {
        return Err(AgentRuntimeError::DependencyCycle(
            "duplicate orchestration node".to_owned(),
        ));
    }
    for node in nodes {
        for dependency in &node.depends_on {
            if !by_id.contains_key(dependency) {
                return Err(AgentRuntimeError::UnknownDependency(format!(
                    "{} requires {dependency}",
                    node.node_id
                )));
            }
        }
    }
    let mut emitted = BTreeSet::new();
    let mut ordered = Vec::with_capacity(nodes.len());
    while ordered.len() < nodes.len() {
        let mut ready: Vec<_> = nodes
            .iter()
            .filter(|node| {
                !emitted.contains(&node.node_id)
                    && node
                        .depends_on
                        .iter()
                        .all(|dependency| emitted.contains(dependency))
            })
            .cloned()
            .collect();
        if ready.is_empty() {
            return Err(AgentRuntimeError::DependencyCycle(
                "orchestration graph contains a cycle".to_owned(),
            ));
        }
        ready.sort_by(|left, right| left.node_id.cmp(&right.node_id));
        for node in ready {
            emitted.insert(node.node_id.clone());
            ordered.push(node);
        }
    }
    Ok(ordered)
}

fn synthetic_node_result(node: &OrchestrationNode) -> Result<NodeResult, AgentRuntimeError> {
    let mut output = BTreeMap::new();
    output.insert("authority".to_owned(), json!("candidate-only"));
    output.insert("node".to_owned(), json!(node.node_id));
    output.insert("structured".to_owned(), json!(true));
    output.insert(
        "value".to_owned(),
        json!(format!("synthetic-{}", node.node_id)),
    );
    let output_digest = canonical_digest(&output)?;
    Ok(NodeResult {
        node_id: node.node_id.clone(),
        status: "completed".to_owned(),
        output_contract: node.output_contract.clone(),
        output,
        output_digest,
    })
}

pub fn run_synthetic(
    request: &RunRequest,
    control: &ExecutionControl,
) -> Result<RunResult, AgentRuntimeError> {
    if !request.policy.enabled {
        return Err(AgentRuntimeError::Disabled);
    }
    validate_provider(request)?;
    validate_attenuation(request)?;
    let ordered_nodes = topological_nodes(&request.agent.orchestration.nodes)?;
    let context = compile_context(&request.context)?;
    let hooks = HookRegistry::new(request.policy.hooks.clone())?;
    let handler = SyntheticHookHandler;
    let mut interventions = Vec::new();
    let mut ledger = EventLedger::new(request);

    ledger.emit(
        LifecycleScope::Run,
        LifecyclePhase::Requested,
        "operator",
        "exocore.agent-runtime.run.v1",
        &json!({"run_id": request.run_id}),
    )?;
    ledger.emit(
        LifecycleScope::Run,
        LifecyclePhase::Started,
        "agent-runtime",
        "exocore.agent-runtime.run.v1",
        &json!({"strategy": request.agent.orchestration.strategy}),
    )?;
    ledger.emit(
        LifecycleScope::ContextAssembly,
        LifecyclePhase::Started,
        "context-assembly",
        "exocore.agent-runtime.context.v1",
        &json!({"sources": request.context.sources.len()}),
    )?;
    ledger.emit(
        LifecycleScope::ContextAssembly,
        LifecyclePhase::Completed,
        "context-assembly",
        "exocore.agent-runtime.context.v1",
        &json!({"packet_digest": context.packet_digest}),
    )?;
    interventions.extend(hooks.invoke(
        LifecycleScope::ContextAssembly,
        HookPoint::After,
        &handler,
    )?);

    let mut node_results = Vec::new();
    let mut status = "completed".to_owned();
    for node in ordered_nodes {
        if control.cancel_before_node.as_deref() == Some(node.node_id.as_str()) {
            ledger.emit(
                LifecycleScope::ChildAgent,
                LifecyclePhase::Cancelled,
                "orchestration",
                "exocore.agent-runtime.child.v1",
                &json!({"node_id": node.node_id, "propagated": true}),
            )?;
            status = "cancelled".to_owned();
            break;
        }
        let child_interventions =
            hooks.invoke(LifecycleScope::ChildAgent, HookPoint::Before, &handler)?;
        if child_interventions
            .iter()
            .any(|intervention| intervention.outcome == HookOutcome::Block)
        {
            return Err(AgentRuntimeError::HookOutcomeDenied(format!(
                "child {} blocked",
                node.node_id
            )));
        }
        interventions.extend(child_interventions);
        let scope = if node.node_type == "aggregation" || node.node_id == "supervisor" {
            LifecycleScope::Aggregation
        } else {
            LifecycleScope::ChildAgent
        };
        ledger.emit(
            scope,
            LifecyclePhase::Started,
            &node.node_id,
            "exocore.agent-runtime.child.v1",
            &json!({"node_id": node.node_id, "input_contract": node.input_contract}),
        )?;
        let result = synthetic_node_result(&node)?;
        ledger.emit(
            scope,
            LifecyclePhase::Completed,
            &node.node_id,
            "exocore.agent-runtime.child-result.v1",
            &json!({"node_id": node.node_id, "output_digest": result.output_digest}),
        )?;
        node_results.push(result);
    }

    let checkpoint_source_event_count = ledger.events.len();
    ledger.emit(
        LifecycleScope::Memory,
        LifecyclePhase::Started,
        "memory-runtime",
        "exocore.agent-runtime.memory.v1",
        &json!({"run_id": request.run_id, "tier": "run"}),
    )?;
    let mut memory_checkpoint = MemoryCheckpoint {
        schema: "exocore.agent-runtime.memory.v1".to_owned(),
        checkpoint_id: format!("checkpoint-{}", request.run_id),
        run_id: request.run_id.clone(),
        tier: "run".to_owned(),
        status: "candidate".to_owned(),
        admitted: false,
        source_event_count: checkpoint_source_event_count,
        summary: format!(
            "synthetic {} run with {} completed node results",
            status,
            node_results.len()
        ),
        checkpoint_digest: String::new(),
    };
    memory_checkpoint.checkpoint_digest = canonical_digest(&memory_checkpoint)?;
    ledger.emit(
        LifecycleScope::Memory,
        LifecyclePhase::Completed,
        "memory-runtime",
        "exocore.agent-runtime.memory.v1",
        &json!({"checkpoint_digest": memory_checkpoint.checkpoint_digest, "admitted": false}),
    )?;

    ledger.emit(
        LifecycleScope::Settlement,
        LifecyclePhase::Started,
        "run-ledger",
        "exocore.agent-runtime.receipt.v1",
        &json!({"status": status}),
    )?;
    ledger.emit(
        LifecycleScope::Settlement,
        LifecyclePhase::Completed,
        "run-ledger",
        "exocore.agent-runtime.receipt.v1",
        &json!({"nodes": node_results.len()}),
    )?;
    ledger.emit(
        LifecycleScope::Run,
        if status == "completed" {
            LifecyclePhase::Completed
        } else {
            LifecyclePhase::Cancelled
        },
        "agent-runtime",
        "exocore.agent-runtime.result.v1",
        &json!({"status": status}),
    )?;

    let event_range_digest = canonical_digest(&ledger.events)?;
    let node_results_digest = canonical_digest(&node_results)?;
    let mut receipt = ExecutionReceipt {
        schema: "exocore.agent-runtime.receipt.v1".to_owned(),
        source_projection_id: AGENT_RUNTIME_SOURCE_ID.to_owned(),
        source_package_digest: AGENT_RUNTIME_SOURCE_DIGEST.to_owned(),
        run_id: request.run_id.clone(),
        status: status.clone(),
        context_digest: context.packet_digest.clone(),
        event_range_digest,
        node_results_digest,
        memory_checkpoint_digest: memory_checkpoint.checkpoint_digest.clone(),
        event_count: ledger.events.len(),
        node_count: node_results.len(),
        network: false,
        provider: false,
        credentials: false,
        private_context: false,
        verified: false,
        limitations: vec![
            "deterministic synthetic provider only".to_owned(),
            "no model behavior evaluated".to_owned(),
            "no native effects or durable authority".to_owned(),
        ],
        receipt_digest: String::new(),
    };
    receipt.receipt_digest = canonical_digest(&receipt)?;

    Ok(RunResult {
        schema: "exocore.agent-runtime.result.v1".to_owned(),
        run_id: request.run_id.clone(),
        status,
        context,
        interventions,
        node_results,
        memory_checkpoint,
        events: ledger.events,
        receipt,
    })
}
