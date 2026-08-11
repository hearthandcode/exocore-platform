use std::collections::BTreeMap;
use std::fmt::{Display, Formatter};

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::contracts::agent_runtime_generated::{
    ContextCacheBand, ContextLayer, ContextSourceType, HookOutcome, HookPoint, LifecyclePhase,
    LifecycleScope, OrchestrationStrategy,
};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RunRequest {
    pub schema: String,
    pub run_id: String,
    pub session: SessionIdentity,
    pub agent: AgentRequest,
    pub model: ModelRoute,
    pub context: ContextRequest,
    pub tools: ToolPolicy,
    pub policy: RunPolicy,
    pub output: OutputPolicy,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SessionIdentity {
    pub session_id: String,
    pub root_run_id: String,
    pub parent_run_id: Option<String>,
    pub correlation_id: String,
    pub idempotency_key: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AgentRequest {
    pub agent_spec_ref: String,
    pub archetype_ref: String,
    pub objective: String,
    pub orchestration: OrchestrationPlan,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct OrchestrationPlan {
    pub strategy: OrchestrationStrategy,
    pub nodes: Vec<OrchestrationNode>,
    pub edges: Vec<OrchestrationEdge>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct OrchestrationNode {
    pub node_id: String,
    pub node_type: String,
    pub agent_spec_ref: Option<String>,
    pub input_contract: String,
    pub output_contract: String,
    pub capabilities: Vec<String>,
    pub tools: Vec<String>,
    pub disclosure: Disclosure,
    pub effects: Vec<String>,
    pub budget: u32,
    pub depends_on: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct OrchestrationEdge {
    pub from: String,
    pub to: String,
    pub kind: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ModelRoute {
    pub provider: String,
    pub model: String,
    pub required_capabilities: Vec<String>,
    pub provider_constraints: ProviderConstraints,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ProviderConstraints {
    pub network: bool,
    pub credentials: bool,
    pub retained_state: bool,
    pub fallback: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ContextRequest {
    pub sources: Vec<ContextSource>,
    pub token_budget: u32,
    pub disclosure: Disclosure,
    pub conflict_policy: String,
    pub omission_receipt: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ContextSource {
    pub source_id: String,
    pub source_type: ContextSourceType,
    pub locator: String,
    pub revision: Value,
    pub digest: String,
    pub authority_class: String,
    pub sensitivity: Disclosure,
    pub disclosure: String,
    pub layer: ContextLayer,
    pub precedence: u32,
    pub cache_band: ContextCacheBand,
    pub freshness: String,
    pub required: bool,
    pub content_mode: String,
    pub token_budget: u32,
    pub provenance: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Disclosure {
    PublicSafe,
    Internal,
    Restricted,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ToolPolicy {
    pub allow: Vec<String>,
    pub block: Vec<String>,
    pub effects: Vec<String>,
    pub parallelism: u8,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RunPolicy {
    pub enabled: bool,
    pub max_turns: u32,
    pub max_child_depth: u8,
    pub max_concurrent_children: u8,
    pub hook_budget: u32,
    pub retry_limit: u8,
    pub timeout_ms: u64,
    pub human_gates: Vec<String>,
    pub hooks: Vec<HookRegistration>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct HookRegistration {
    pub hook_id: String,
    pub owner: String,
    pub scope: LifecycleScope,
    pub point: HookPoint,
    pub priority: u32,
    pub dependencies: Vec<String>,
    pub input_contract: String,
    pub output_contract: String,
    pub allowed_outcomes: Vec<HookOutcome>,
    pub effect: String,
    pub authority_requirement: String,
    pub timeout_ms: u64,
    pub call_budget: u32,
    pub idempotency: String,
    pub replay: String,
    pub failure_mode: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct OutputPolicy {
    pub contract: String,
    pub strict: bool,
    pub repair_attempts: u8,
    pub receipt_route: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ContextReceiptEntry {
    pub source_id: String,
    pub outcome: String,
    pub reason: String,
    pub layer: ContextLayer,
    pub digest: String,
    pub token_budget: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CompiledContext {
    pub included: Vec<ContextReceiptEntry>,
    pub omitted: Vec<ContextReceiptEntry>,
    pub total_token_budget: u32,
    pub packet_digest: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct HookIntervention {
    pub hook_id: String,
    pub owner: String,
    pub outcome: HookOutcome,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct LifecycleEvent {
    pub schema: String,
    pub event_id: String,
    pub session_id: String,
    pub root_run_id: String,
    pub run_id: String,
    pub parent_run_id: Option<String>,
    pub correlation_id: String,
    pub causation_id: Option<String>,
    pub sequence: u64,
    pub scope: LifecycleScope,
    pub phase: LifecyclePhase,
    pub actor: String,
    pub source_module: String,
    pub visibility: Disclosure,
    pub payload_contract: String,
    pub payload_digest: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct NodeResult {
    pub node_id: String,
    pub status: String,
    pub output_contract: String,
    pub output: BTreeMap<String, Value>,
    pub output_digest: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MemoryCheckpoint {
    pub schema: String,
    pub checkpoint_id: String,
    pub run_id: String,
    pub tier: String,
    pub status: String,
    pub admitted: bool,
    pub source_event_count: usize,
    pub summary: String,
    pub checkpoint_digest: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ExecutionReceipt {
    pub schema: String,
    pub source_projection_id: String,
    pub source_package_digest: String,
    pub run_id: String,
    pub status: String,
    pub context_digest: String,
    pub event_range_digest: String,
    pub node_results_digest: String,
    pub memory_checkpoint_digest: String,
    pub event_count: usize,
    pub node_count: usize,
    pub network: bool,
    pub provider: bool,
    pub credentials: bool,
    pub private_context: bool,
    pub verified: bool,
    pub limitations: Vec<String>,
    pub receipt_digest: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RunResult {
    pub schema: String,
    pub run_id: String,
    pub status: String,
    pub context: CompiledContext,
    pub interventions: Vec<HookIntervention>,
    pub node_results: Vec<NodeResult>,
    pub memory_checkpoint: MemoryCheckpoint,
    pub events: Vec<LifecycleEvent>,
    pub receipt: ExecutionReceipt,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ExecutionControl {
    pub cancel_before_node: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AgentRuntimeError {
    Disabled,
    InvalidContext(String),
    UnknownDependency(String),
    DependencyCycle(String),
    CapabilityEscalation(String),
    ToolEscalation(String),
    EffectEscalation(String),
    DisclosureEscalation(String),
    HookDependency(String),
    HookOutcomeDenied(String),
    HookConflict(String),
    Cancelled(String),
    Serialization(String),
}

impl AgentRuntimeError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::Disabled => "E_AGENT_RUNTIME_DISABLED",
            Self::InvalidContext(_) => "E_CONTEXT_INVALID",
            Self::UnknownDependency(_) => "E_UNKNOWN_DEPENDENCY",
            Self::DependencyCycle(_) => "E_DEPENDENCY_CYCLE",
            Self::CapabilityEscalation(_) => "E_CHILD_CAPABILITY_ESCALATION",
            Self::ToolEscalation(_) => "E_CHILD_TOOL_ESCALATION",
            Self::EffectEscalation(_) => "E_CHILD_EFFECT_ESCALATION",
            Self::DisclosureEscalation(_) => "E_CHILD_DISCLOSURE_ESCALATION",
            Self::HookDependency(_) => "E_HOOK_DEPENDENCY",
            Self::HookOutcomeDenied(_) => "E_HOOK_OUTCOME_DENIED",
            Self::HookConflict(_) => "E_HOOK_CONFLICT",
            Self::Cancelled(_) => "E_RUN_CANCELLED",
            Self::Serialization(_) => "E_AGENT_RUNTIME_SERIALIZATION",
        }
    }
}

impl Display for AgentRuntimeError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        let detail = match self {
            Self::Disabled => "agent runtime is disabled",
            Self::InvalidContext(detail)
            | Self::UnknownDependency(detail)
            | Self::DependencyCycle(detail)
            | Self::CapabilityEscalation(detail)
            | Self::ToolEscalation(detail)
            | Self::EffectEscalation(detail)
            | Self::DisclosureEscalation(detail)
            | Self::HookDependency(detail)
            | Self::HookOutcomeDenied(detail)
            | Self::HookConflict(detail)
            | Self::Cancelled(detail)
            | Self::Serialization(detail) => detail,
        };
        write!(formatter, "{}: {detail}", self.code())
    }
}

impl std::error::Error for AgentRuntimeError {}
