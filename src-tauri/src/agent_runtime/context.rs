use crate::contracts::agent_runtime_generated::ContextLayer;

use super::canonical_digest;
use super::models::{
    AgentRuntimeError, CompiledContext, ContextReceiptEntry, ContextRequest, ContextSource,
    Disclosure,
};

fn layer_rank(layer: ContextLayer) -> u8 {
    match layer {
        ContextLayer::KernelPolicy => 0,
        ContextLayer::OperatorIdentity => 1,
        ContextLayer::HubOperationalGovernance => 2,
        ContextLayer::ProgramArchetype => 3,
        ContextLayer::RepositoryProject => 4,
        ContextLayer::DirectoryLocal => 5,
        ContextLayer::TaskWorkflow => 6,
        ContextLayer::TurnRuntimeInjection => 7,
    }
}

fn disclosure_allows(maximum: Disclosure, source: Disclosure) -> bool {
    source <= maximum
}

fn receipt(source: &ContextSource, outcome: &str, reason: &str) -> ContextReceiptEntry {
    ContextReceiptEntry {
        source_id: source.source_id.clone(),
        outcome: outcome.to_owned(),
        reason: reason.to_owned(),
        layer: source.layer,
        digest: source.digest.clone(),
        token_budget: source.token_budget,
    }
}

pub fn compile_context(request: &ContextRequest) -> Result<CompiledContext, AgentRuntimeError> {
    if !request.omission_receipt {
        return Err(AgentRuntimeError::InvalidContext(
            "omission receipt is required".to_owned(),
        ));
    }
    let mut sources = request.sources.clone();
    sources.sort_by(|left, right| {
        layer_rank(left.layer)
            .cmp(&layer_rank(right.layer))
            .then_with(|| right.precedence.cmp(&left.precedence))
            .then_with(|| left.source_id.cmp(&right.source_id))
    });

    let mut included = Vec::new();
    let mut omitted = Vec::new();
    let mut consumed = 0_u32;
    let mut seen = std::collections::BTreeSet::new();

    for source in sources {
        if !seen.insert(source.source_id.clone()) {
            return Err(AgentRuntimeError::InvalidContext(format!(
                "duplicate context source {}",
                source.source_id
            )));
        }
        if !source.digest.starts_with("sha256:") || source.digest.len() != 71 {
            return Err(AgentRuntimeError::InvalidContext(format!(
                "invalid digest for {}",
                source.source_id
            )));
        }
        if source.freshness != "current" {
            if source.required {
                return Err(AgentRuntimeError::InvalidContext(format!(
                    "required source {} is {}",
                    source.source_id, source.freshness
                )));
            }
            omitted.push(receipt(&source, "stale", "optional source is not current"));
            continue;
        }
        if source.disclosure == "deny" {
            if source.required {
                return Err(AgentRuntimeError::InvalidContext(format!(
                    "required source {} is denied",
                    source.source_id
                )));
            }
            omitted.push(receipt(&source, "blocked", "source disclosure is denied"));
            continue;
        }
        if !disclosure_allows(request.disclosure, source.sensitivity) {
            if source.required {
                return Err(AgentRuntimeError::InvalidContext(format!(
                    "required source {} exceeds disclosure",
                    source.source_id
                )));
            }
            omitted.push(receipt(
                &source,
                "excluded",
                "source sensitivity exceeds run disclosure",
            ));
            continue;
        }
        let next = consumed.saturating_add(source.token_budget);
        if next > request.token_budget {
            if source.required {
                return Err(AgentRuntimeError::InvalidContext(format!(
                    "required source {} exceeds token budget",
                    source.source_id
                )));
            }
            omitted.push(receipt(
                &source,
                "budget-exceeded",
                "optional source omitted by token budget",
            ));
            continue;
        }
        consumed = next;
        let outcome = if source.disclosure == "summarize" {
            "summarized"
        } else {
            "included"
        };
        included.push(receipt(&source, outcome, "source admitted"));
    }

    let packet_digest = canonical_digest(&(included.as_slice(), omitted.as_slice(), consumed))?;
    Ok(CompiledContext {
        included,
        omitted,
        total_token_budget: consumed,
        packet_digest,
    })
}
