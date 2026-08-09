use serde::{Deserialize, Serialize};

use super::{ErrorCode, TypedError};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Capability {
    FoundationStatus,
    FoundationEcho,
    FoundationModuleControl,
    SourceRead,
    Process,
    Network,
    Secret,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Decision {
    Allow,
    Deny,
}

#[derive(Debug, Default)]
pub struct AuthorityPolicy;

impl AuthorityPolicy {
    pub fn decide(&self, capability: Capability) -> Decision {
        match capability {
            Capability::FoundationStatus
            | Capability::FoundationEcho
            | Capability::FoundationModuleControl => Decision::Allow,
            Capability::SourceRead
            | Capability::Process
            | Capability::Network
            | Capability::Secret => Decision::Deny,
        }
    }

    pub fn require(
        &self,
        capability: Capability,
        operation: &str,
        correlation_id: &str,
    ) -> Result<(), TypedError> {
        match self.decide(capability) {
            Decision::Allow => Ok(()),
            Decision::Deny => Err(TypedError::new(
                ErrorCode::Denied,
                operation,
                "the requested capability is not admitted by the foundation",
                false,
                "use an explicitly admitted concept-shaped operation",
                correlation_id,
            )),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn policy_is_deny_by_default_for_effects() {
        let policy = AuthorityPolicy;
        assert_eq!(policy.decide(Capability::FoundationEcho), Decision::Allow);
        assert_eq!(policy.decide(Capability::Network), Decision::Deny);
        assert_eq!(policy.decide(Capability::SourceRead), Decision::Deny);
    }
}
