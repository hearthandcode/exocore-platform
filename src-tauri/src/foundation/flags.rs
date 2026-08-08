use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use super::{ErrorCode, TypedError};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct FlagDeclaration {
    pub flag_id: String,
    pub default: bool,
    pub owner: String,
    pub enabled_behavior: String,
    pub disabled_behavior: String,
}

#[derive(Debug, Default, Clone)]
pub struct FlagRegistry {
    declarations: BTreeMap<String, FlagDeclaration>,
    overrides: BTreeMap<String, bool>,
}

impl FlagRegistry {
    pub fn register(
        &mut self,
        declaration: FlagDeclaration,
        correlation_id: &str,
    ) -> Result<(), TypedError> {
        if declaration.flag_id.trim().is_empty()
            || declaration.owner.trim().is_empty()
            || declaration.default
        {
            return Err(TypedError::new(
                ErrorCode::Validation,
                "exocore.feature-flag.v1",
                "flag declaration is invalid or not deny-by-default",
                true,
                "provide an owned flag with a false safe default",
                correlation_id,
            ));
        }
        if self.declarations.contains_key(&declaration.flag_id) {
            return Err(TypedError::new(
                ErrorCode::Validation,
                "exocore.feature-flag.v1",
                "flag id is already registered",
                true,
                "choose a unique namespaced flag id",
                correlation_id,
            ));
        }
        self.declarations
            .insert(declaration.flag_id.clone(), declaration);
        Ok(())
    }

    pub fn is_enabled(&self, flag_id: &str, correlation_id: &str) -> Result<bool, TypedError> {
        let declaration = self.declarations.get(flag_id).ok_or_else(|| {
            TypedError::new(
                ErrorCode::Unregistered,
                "exocore.feature-flag.v1",
                "flag id is not registered",
                true,
                "register the flag before reading it",
                correlation_id,
            )
        })?;
        Ok(*self.overrides.get(flag_id).unwrap_or(&declaration.default))
    }

    pub fn set(
        &mut self,
        flag_id: &str,
        enabled: bool,
        correlation_id: &str,
    ) -> Result<(), TypedError> {
        if !self.declarations.contains_key(flag_id) {
            return Err(TypedError::new(
                ErrorCode::Unregistered,
                "exocore.feature-flag.v1",
                "cannot override an unregistered flag",
                true,
                "register the flag before setting it",
                correlation_id,
            ));
        }
        self.overrides.insert(flag_id.to_owned(), enabled);
        Ok(())
    }

    pub fn unregister(&mut self, flag_id: &str) {
        self.declarations.remove(flag_id);
        self.overrides.remove(flag_id);
    }

    pub fn contains(&self, flag_id: &str) -> bool {
        self.declarations.contains_key(flag_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn flag() -> FlagDeclaration {
        FlagDeclaration {
            flag_id: "foundation.skeleton_ui".into(),
            default: false,
            owner: "foundation".into(),
            enabled_behavior: "show local route".into(),
            disabled_behavior: "route absent".into(),
        }
    }

    #[test]
    fn flags_are_off_by_default_and_unknown_ids_fail() {
        let mut registry = FlagRegistry::default();
        registry.register(flag(), "c").unwrap();
        assert!(!registry.is_enabled("foundation.skeleton_ui", "c").unwrap());
        assert!(registry.is_enabled("unknown", "c").is_err());
    }

    #[test]
    fn duplicate_and_true_default_are_rejected() {
        let mut registry = FlagRegistry::default();
        registry.register(flag(), "c").unwrap();
        assert!(registry.register(flag(), "c").is_err());
        let mut unsafe_flag = flag();
        unsafe_flag.flag_id = "foundation.unsafe".into();
        unsafe_flag.default = true;
        assert!(registry.register(unsafe_flag, "c").is_err());
    }
}
