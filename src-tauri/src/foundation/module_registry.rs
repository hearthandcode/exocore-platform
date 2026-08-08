use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};

use super::flags::{FlagDeclaration, FlagRegistry};
use super::{ErrorCode, TypedError};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ModuleManifest {
    pub schema: String,
    pub module_id: String,
    pub module_version: String,
    pub register: String,
    pub config_schema: String,
    pub flag_declaration: FlagDeclaration,
    #[serde(default)]
    pub routes: Vec<String>,
    #[serde(default)]
    pub commands: Vec<String>,
    pub contracts: Vec<String>,
    #[serde(default)]
    pub config_keys: Vec<String>,
    pub health: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ModuleHealth {
    pub module_id: String,
    pub registered: bool,
    pub enabled: bool,
}

#[derive(Debug, Default)]
pub struct ModuleRegistry {
    modules: BTreeMap<String, ModuleManifest>,
    pub flags: FlagRegistry,
    routes: BTreeSet<String>,
    commands: BTreeSet<String>,
    contracts: BTreeSet<String>,
    config_keys: BTreeSet<String>,
}

impl ModuleRegistry {
    pub fn mount(
        &mut self,
        manifest: ModuleManifest,
        correlation_id: &str,
    ) -> Result<ModuleHealth, TypedError> {
        self.validate_manifest(&manifest, correlation_id)?;
        self.flags
            .register(manifest.flag_declaration.clone(), correlation_id)?;
        self.routes.extend(manifest.routes.iter().cloned());
        self.commands.extend(manifest.commands.iter().cloned());
        self.contracts.extend(manifest.contracts.iter().cloned());
        self.config_keys
            .extend(manifest.config_keys.iter().cloned());
        let module_id = manifest.module_id.clone();
        self.modules.insert(module_id.clone(), manifest);
        Ok(ModuleHealth {
            module_id,
            registered: true,
            enabled: false,
        })
    }

    fn validate_manifest(
        &self,
        manifest: &ModuleManifest,
        correlation_id: &str,
    ) -> Result<(), TypedError> {
        let valid_shape = manifest.schema == "exocore.module-mount.v1"
            && valid_slug(&manifest.module_id)
            && valid_semver(&manifest.module_version)
            && manifest.register == "register"
            && manifest.health == "health"
            && valid_contract_id(&manifest.config_schema)
            && !manifest.contracts.is_empty()
            && manifest.contracts.iter().all(|id| valid_contract_id(id))
            && manifest.routes.iter().all(|id| valid_contract_id(id))
            && manifest.commands.iter().all(|id| valid_contract_id(id))
            && manifest
                .config_keys
                .iter()
                .all(|key| key.starts_with(&format!("{}.", manifest.module_id)))
            && manifest.flag_declaration.owner == manifest.module_id
            && !manifest.flag_declaration.default;
        if !valid_shape {
            return Err(validation_error(
                "module manifest violates exocore.module-mount.v1",
                correlation_id,
            ));
        }
        if self.modules.contains_key(&manifest.module_id)
            || self.flags.contains(&manifest.flag_declaration.flag_id)
            || overlaps(&self.routes, &manifest.routes)
            || overlaps(&self.commands, &manifest.commands)
            || overlaps(&self.contracts, &manifest.contracts)
            || overlaps(&self.config_keys, &manifest.config_keys)
        {
            return Err(validation_error(
                "module manifest collides with a registered namespace",
                correlation_id,
            ));
        }
        if has_duplicates(&manifest.routes)
            || has_duplicates(&manifest.commands)
            || has_duplicates(&manifest.contracts)
            || has_duplicates(&manifest.config_keys)
        {
            return Err(validation_error(
                "module manifest repeats a namespace",
                correlation_id,
            ));
        }
        Ok(())
    }

    pub fn unmount(&mut self, module_id: &str, correlation_id: &str) -> Result<(), TypedError> {
        let manifest = self.modules.remove(module_id).ok_or_else(|| {
            TypedError::new(
                ErrorCode::Unregistered,
                "exocore.module-mount.v1",
                "module is not registered",
                true,
                "mount the module before unmounting it",
                correlation_id,
            )
        })?;
        self.flags.unregister(&manifest.flag_declaration.flag_id);
        for id in manifest.routes {
            self.routes.remove(&id);
        }
        for id in manifest.commands {
            self.commands.remove(&id);
        }
        for id in manifest.contracts {
            self.contracts.remove(&id);
        }
        for key in manifest.config_keys {
            self.config_keys.remove(&key);
        }
        Ok(())
    }

    pub fn module_count(&self) -> usize {
        self.modules.len()
    }

    pub fn require_enabled(&self, module_id: &str, correlation_id: &str) -> Result<(), TypedError> {
        let health = self.health(module_id, correlation_id)?;
        if health.enabled {
            Ok(())
        } else {
            Err(TypedError::new(
                ErrorCode::Disabled,
                "exocore.module-mount.v1",
                "module is disabled by its safe-default feature flag",
                true,
                "enable the reviewed module flag before invoking its exports",
                correlation_id,
            ))
        }
    }

    pub fn health(
        &self,
        module_id: &str,
        correlation_id: &str,
    ) -> Result<ModuleHealth, TypedError> {
        let manifest = self.modules.get(module_id).ok_or_else(|| {
            TypedError::new(
                ErrorCode::Unregistered,
                "exocore.module-mount.v1",
                "module is not registered",
                true,
                "mount the module before checking health",
                correlation_id,
            )
        })?;
        Ok(ModuleHealth {
            module_id: module_id.into(),
            registered: true,
            enabled: self
                .flags
                .is_enabled(&manifest.flag_declaration.flag_id, correlation_id)?,
        })
    }
}

fn validation_error(message: &str, correlation_id: &str) -> TypedError {
    TypedError::new(
        ErrorCode::Validation,
        "exocore.module-mount.v1",
        message,
        true,
        "correct the manifest and retry the atomic mount",
        correlation_id,
    )
}

fn valid_slug(value: &str) -> bool {
    value.len() >= 2
        && value.len() <= 63
        && value.chars().enumerate().all(|(index, c)| {
            c.is_ascii_lowercase() || c.is_ascii_digit() || (c == '-' && index > 0)
        })
}

fn valid_semver(value: &str) -> bool {
    value.split('.').count() == 3
        && value
            .split('.')
            .all(|part| !part.is_empty() && part.chars().all(|c| c.is_ascii_digit()))
}

fn valid_contract_id(value: &str) -> bool {
    value.starts_with("exocore.")
        && value.rsplit_once(".v").is_some_and(|(_, version)| {
            !version.is_empty() && version.chars().all(|c| c.is_ascii_digit())
        })
}

fn overlaps(existing: &BTreeSet<String>, candidate: &[String]) -> bool {
    candidate.iter().any(|item| existing.contains(item))
}

fn has_duplicates(values: &[String]) -> bool {
    values.iter().collect::<BTreeSet<_>>().len() != values.len()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn manifest(module_id: &str) -> ModuleManifest {
        ModuleManifest {
            schema: "exocore.module-mount.v1".into(),
            module_id: module_id.into(),
            module_version: "0.1.0".into(),
            register: "register".into(),
            config_schema: format!("exocore.{module_id}.config.v1"),
            flag_declaration: FlagDeclaration {
                flag_id: format!("{module_id}.enabled"),
                default: false,
                owner: module_id.into(),
                enabled_behavior: "active".into(),
                disabled_behavior: "inert".into(),
            },
            routes: vec![format!("exocore.{module_id}.route.v1")],
            commands: vec![format!("exocore.{module_id}.command.v1")],
            contracts: vec![format!("exocore.{module_id}.v1")],
            config_keys: vec![format!("{module_id}.store_path")],
            health: "health".into(),
        }
    }

    #[test]
    fn valid_mount_and_unmount_are_atomic() {
        let mut registry = ModuleRegistry::default();
        let health = registry.mount(manifest("sample-module"), "c").unwrap();
        assert!(health.registered);
        assert!(!health.enabled);
        assert_eq!(registry.module_count(), 1);
        registry.unmount("sample-module", "c").unwrap();
        assert_eq!(registry.module_count(), 0);
    }

    #[test]
    fn disabled_module_exports_fail_closed() {
        let mut registry = ModuleRegistry::default();
        registry.mount(manifest("sample-module"), "c").unwrap();
        let error = registry.require_enabled("sample-module", "c").unwrap_err();
        assert_eq!(error.code, "E_DISABLED");
        registry
            .flags
            .set("sample-module.enabled", true, "c")
            .unwrap();
        assert!(registry.require_enabled("sample-module", "c").is_ok());
    }

    #[test]
    fn duplicate_module_and_contract_are_rejected_without_partial_mount() {
        let mut registry = ModuleRegistry::default();
        registry.mount(manifest("sample-module"), "c").unwrap();
        assert!(registry.mount(manifest("sample-module"), "c").is_err());
        let mut collision = manifest("other-module");
        collision.contracts = vec!["exocore.sample-module.v1".into()];
        assert!(registry.mount(collision, "c").is_err());
        assert_eq!(registry.module_count(), 1);
    }

    #[test]
    fn invalid_config_namespace_and_true_default_are_rejected() {
        let mut registry = ModuleRegistry::default();
        let mut invalid = manifest("sample-module");
        invalid.config_schema = "not-versioned".into();
        assert!(registry.mount(invalid, "c").is_err());
        let mut unsafe_default = manifest("sample-module");
        unsafe_default.flag_declaration.default = true;
        assert!(registry.mount(unsafe_default, "c").is_err());
        assert_eq!(registry.module_count(), 0);
    }
}
