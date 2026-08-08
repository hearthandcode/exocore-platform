use serde::{Deserialize, Serialize};

use super::{ErrorCode, TypedError};

fn default_max_bytes() -> usize {
    1_048_576
}
fn default_utf8_policy() -> String {
    "strict".into()
}
fn default_level() -> String {
    "info".into()
}
fn default_sink() -> String {
    "stdout".into()
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AuthorityConfig {
    #[serde(default = "default_deny")]
    pub default_posture: String,
    #[serde(default = "default_unknown")]
    pub fallback_class: String,
}

fn default_deny() -> String {
    "deny".into()
}
fn default_unknown() -> String {
    "unknown".into()
}

impl Default for AuthorityConfig {
    fn default() -> Self {
        Self {
            default_posture: default_deny(),
            fallback_class: default_unknown(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SourceConfig {
    #[serde(default)]
    pub allowed_roots: Vec<String>,
    #[serde(default = "default_max_bytes")]
    pub max_bytes: usize,
    #[serde(default = "default_utf8_policy")]
    pub utf8_policy: String,
}

impl Default for SourceConfig {
    fn default() -> Self {
        Self {
            allowed_roots: vec![],
            max_bytes: default_max_bytes(),
            utf8_policy: default_utf8_policy(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TelemetryConfig {
    #[serde(default = "default_level")]
    pub level: String,
    #[serde(default = "default_sink")]
    pub sink: String,
}

impl Default for TelemetryConfig {
    fn default() -> Self {
        Self {
            level: default_level(),
            sink: default_sink(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct FoundationConfig {
    #[serde(default)]
    pub authority: AuthorityConfig,
    #[serde(default)]
    pub source: SourceConfig,
    #[serde(default)]
    pub telemetry: TelemetryConfig,
}

impl FoundationConfig {
    pub fn from_layers(
        package_defaults: &str,
        environment_overlay: Option<&str>,
        correlation_id: &str,
    ) -> Result<Self, TypedError> {
        let mut merged: serde_json::Value = serde_json::from_str(package_defaults)
            .map_err(|_| config_parse_error(correlation_id))?;
        if let Some(overlay) = environment_overlay {
            let overlay: serde_json::Value =
                serde_json::from_str(overlay).map_err(|_| config_parse_error(correlation_id))?;
            merge_values(&mut merged, overlay);
        }
        let serialized =
            serde_json::to_string(&merged).map_err(|_| config_parse_error(correlation_id))?;
        Self::from_json(&serialized, correlation_id)
    }

    pub fn from_json(value: &str, correlation_id: &str) -> Result<Self, TypedError> {
        let config: Self = serde_json::from_str(value).map_err(|_| {
            TypedError::new(
                ErrorCode::Config,
                "exocore.config.v1",
                "foundation configuration is invalid",
                false,
                "correct unknown fields or invalid values before retrying",
                correlation_id,
            )
        })?;
        config.validate(correlation_id)?;
        Ok(config)
    }

    pub fn validate(&self, correlation_id: &str) -> Result<(), TypedError> {
        let valid = self.authority.default_posture == "deny"
            && self.authority.fallback_class == "unknown"
            && self.source.max_bytes > 0
            && self.source.utf8_policy == "strict"
            && matches!(
                self.telemetry.level.as_str(),
                "error" | "warn" | "info" | "debug"
            )
            && self.telemetry.sink == "stdout";
        if valid {
            Ok(())
        } else {
            Err(TypedError::new(
                ErrorCode::Config,
                "exocore.config.v1",
                "foundation configuration violates a safe invariant",
                false,
                "restore deny, unknown, strict UTF-8, positive bounds, and the local stdout sink",
                correlation_id,
            ))
        }
    }
}

fn merge_values(base: &mut serde_json::Value, overlay: serde_json::Value) {
    match (base, overlay) {
        (serde_json::Value::Object(base), serde_json::Value::Object(overlay)) => {
            for (key, value) in overlay {
                merge_values(base.entry(key).or_insert(serde_json::Value::Null), value);
            }
        }
        (base, overlay) => *base = overlay,
    }
}

fn config_parse_error(correlation_id: &str) -> TypedError {
    TypedError::new(
        ErrorCode::Config,
        "exocore.config.v1",
        "foundation configuration layer is invalid",
        false,
        "correct the package defaults or named environment overlay before retrying",
        correlation_id,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_are_conservative() {
        let config = FoundationConfig::default();
        assert_eq!(config.authority.default_posture, "deny");
        assert!(config.source.allowed_roots.is_empty());
        assert_eq!(config.telemetry.sink, "stdout");
    }

    #[test]
    fn a_named_environment_overlay_uses_the_same_validation_path() {
        let config = FoundationConfig::from_layers(
            include_str!("../../../contracts/foundation/default.config.json"),
            Some(r#"{"telemetry":{"level":"debug"}}"#),
            "c",
        )
        .unwrap();
        assert_eq!(config.telemetry.level, "debug");
        assert_eq!(config.authority.default_posture, "deny");
        assert!(FoundationConfig::from_layers(
            include_str!("../../../contracts/foundation/default.config.json"),
            Some(r#"{"authority":{"default_posture":"allow"}}"#),
            "c",
        )
        .is_err());
    }

    #[test]
    fn unknown_and_unsafe_config_fail_closed() {
        assert!(FoundationConfig::from_json(r#"{"surprise":true}"#, "c").is_err());
        assert!(FoundationConfig::from_json(
            r#"{"authority":{"default_posture":"allow","fallback_class":"unknown"}}"#,
            "c"
        )
        .is_err());
    }
}
