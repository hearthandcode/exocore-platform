use std::collections::{BTreeMap, BTreeSet};

use crate::contracts::agent_runtime_generated::{HookOutcome, HookPoint, LifecycleScope};

use super::models::{AgentRuntimeError, HookIntervention, HookRegistration};

pub trait HookHandler {
    fn decide(&self, registration: &HookRegistration) -> HookOutcome;

    fn detail(&self, registration: &HookRegistration, outcome: HookOutcome) -> String {
        format!("{} returned {outcome:?}", registration.hook_id)
    }
}

#[derive(Debug, Clone)]
pub struct HookRegistry {
    ordered: Vec<HookRegistration>,
}

impl HookRegistry {
    pub fn new(registrations: Vec<HookRegistration>) -> Result<Self, AgentRuntimeError> {
        let mut by_id = BTreeMap::new();
        for registration in registrations {
            if by_id
                .insert(registration.hook_id.clone(), registration)
                .is_some()
            {
                return Err(AgentRuntimeError::HookDependency(
                    "duplicate hook identifier".to_owned(),
                ));
            }
        }
        for registration in by_id.values() {
            for dependency in &registration.dependencies {
                if !by_id.contains_key(dependency) {
                    return Err(AgentRuntimeError::HookDependency(format!(
                        "{} requires unknown hook {dependency}",
                        registration.hook_id
                    )));
                }
            }
        }

        let mut emitted = BTreeSet::new();
        let mut ordered = Vec::with_capacity(by_id.len());
        while emitted.len() < by_id.len() {
            let mut ready: Vec<_> = by_id
                .values()
                .filter(|registration| {
                    !emitted.contains(&registration.hook_id)
                        && registration
                            .dependencies
                            .iter()
                            .all(|dependency| emitted.contains(dependency))
                })
                .cloned()
                .collect();
            if ready.is_empty() {
                return Err(AgentRuntimeError::HookDependency(
                    "hook dependency cycle".to_owned(),
                ));
            }
            ready.sort_by(|left, right| {
                left.scope
                    .cmp(&right.scope)
                    .then_with(|| left.point.cmp(&right.point))
                    .then_with(|| left.priority.cmp(&right.priority))
                    .then_with(|| left.owner.cmp(&right.owner))
                    .then_with(|| left.hook_id.cmp(&right.hook_id))
            });
            for registration in ready {
                emitted.insert(registration.hook_id.clone());
                ordered.push(registration);
            }
        }
        Ok(Self { ordered })
    }

    pub fn invoke(
        &self,
        scope: LifecycleScope,
        point: HookPoint,
        handler: &impl HookHandler,
    ) -> Result<Vec<HookIntervention>, AgentRuntimeError> {
        let mut interventions = Vec::new();
        let mut patch_seen = false;
        for registration in self
            .ordered
            .iter()
            .filter(|registration| registration.scope == scope && registration.point == point)
        {
            let outcome = handler.decide(registration);
            if !registration.allowed_outcomes.contains(&outcome) {
                return Err(AgentRuntimeError::HookOutcomeDenied(format!(
                    "{} denied {outcome:?}",
                    registration.hook_id
                )));
            }
            if outcome == HookOutcome::Patch {
                if patch_seen {
                    return Err(AgentRuntimeError::HookConflict(format!(
                        "multiple exclusive patches at {scope:?}/{point:?}"
                    )));
                }
                patch_seen = true;
            }
            interventions.push(HookIntervention {
                hook_id: registration.hook_id.clone(),
                owner: registration.owner.clone(),
                outcome,
                detail: handler.detail(registration, outcome),
            });
        }
        Ok(interventions)
    }
}

#[derive(Debug, Clone, Copy, Default)]
pub struct SyntheticHookHandler;

impl HookHandler for SyntheticHookHandler {
    fn decide(&self, registration: &HookRegistration) -> HookOutcome {
        let id = registration.hook_id.as_str();
        if id.contains("append") || id == "observe-context" {
            HookOutcome::Append
        } else if id.contains("patch") {
            HookOutcome::Patch
        } else if id.contains("block") {
            HookOutcome::Block
        } else if id.contains("retry") {
            HookOutcome::Retry
        } else if id.contains("redirect") {
            HookOutcome::Redirect
        } else if id.contains("suspend") {
            HookOutcome::Suspend
        } else if id.contains("terminate") {
            HookOutcome::Terminate
        } else {
            HookOutcome::Continue
        }
    }
}
