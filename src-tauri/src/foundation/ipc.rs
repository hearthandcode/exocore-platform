use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

use super::actor::ActorSupervisor;
use super::authority::{AuthorityPolicy, Capability};
use super::config::FoundationConfig;
use super::flags::FlagDeclaration;
use super::identity::correlation_id;
use super::module_registry::{ModuleManifest, ModuleRegistry};
use super::telemetry::TraceEvent;
use super::{ErrorCode, TypedError};

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct FoundationStatus {
    pub schema: &'static str,
    pub version: &'static str,
    pub default_authority: String,
    pub source_roots: usize,
    pub registered_modules: usize,
    pub skeleton_ui_enabled: bool,
    pub actor_healthy: bool,
    pub mount_contract: &'static str,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct FoundationEchoRequest {
    pub schema: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct FoundationEchoResponse {
    pub schema: &'static str,
    pub message: String,
    pub correlation_id: String,
    pub trace: TraceEvent,
}

#[derive(Debug)]
pub struct FoundationRuntime {
    config: FoundationConfig,
    registry: ModuleRegistry,
}

impl FoundationRuntime {
    pub fn new() -> Result<Self, TypedError> {
        let correlation = correlation_id("exocore.foundation-runtime.v1", b"startup");
        let config = FoundationConfig::from_json("{}", &correlation)?;
        let mut registry = ModuleRegistry::default();
        registry.mount(demonstration_manifest(), &correlation)?;
        Ok(Self { config, registry })
    }

    pub fn status(&self) -> Result<FoundationStatus, TypedError> {
        let correlation = correlation_id("exocore.foundation-status.v1", b"");
        AuthorityPolicy.require(
            Capability::FoundationStatus,
            "exocore.foundation-status.v1",
            &correlation,
        )?;
        self.config.validate(&correlation)?;
        let health = self.registry.health("foundation", &correlation)?;
        let actor = ActorSupervisor::start();
        Ok(FoundationStatus {
            schema: "exocore.foundation-status.v1",
            version: "0.1.0",
            default_authority: self.config.authority.default_posture.clone(),
            source_roots: self.config.source.allowed_roots.len(),
            registered_modules: self.registry.module_count(),
            skeleton_ui_enabled: health.enabled,
            actor_healthy: actor.is_healthy(),
            mount_contract: "exocore.module-mount.v1",
        })
    }

    pub fn set_skeleton_ui(&mut self, enabled: bool) -> Result<FoundationStatus, TypedError> {
        let correlation = correlation_id(
            "exocore.foundation-flag.v1",
            if enabled { b"enabled" } else { b"disabled" },
        );
        self.registry
            .flags
            .set("foundation.skeleton_ui", enabled, &correlation)?;
        self.status()
    }
}

#[tauri::command]
pub fn foundation_status(
    runtime: State<'_, Mutex<FoundationRuntime>>,
) -> Result<FoundationStatus, TypedError> {
    runtime
        .lock()
        .map_err(|_| runtime_lock_error("exocore.foundation-status.v1"))?
        .status()
}

#[tauri::command]
pub fn foundation_set_skeleton_ui(
    runtime: State<'_, Mutex<FoundationRuntime>>,
    enabled: bool,
) -> Result<FoundationStatus, TypedError> {
    runtime
        .lock()
        .map_err(|_| runtime_lock_error("exocore.foundation-flag.v1"))?
        .set_skeleton_ui(enabled)
}

#[tauri::command]
pub fn foundation_echo(
    request: FoundationEchoRequest,
) -> Result<FoundationEchoResponse, TypedError> {
    echo(request)
}

pub fn status() -> Result<FoundationStatus, TypedError> {
    FoundationRuntime::new()?.status()
}

pub fn echo(request: FoundationEchoRequest) -> Result<FoundationEchoResponse, TypedError> {
    let correlation = correlation_id("exocore.echo.v1", request.message.as_bytes());
    AuthorityPolicy.require(Capability::FoundationEcho, "exocore.echo.v1", &correlation)?;
    if request.schema != "exocore.echo-request.v1"
        || request.message.is_empty()
        || request.message.len() > 256
        || request.message.chars().any(|character| {
            (character.is_control() && !matches!(character, '\n' | '\t'))
                || matches!(
                    character,
                    '\u{202a}'
                        ..='\u{202e}' | '\u{2066}'..='\u{2069}' | '\u{feff}'
                )
        })
    {
        return Err(TypedError::new(
            ErrorCode::Validation,
            "exocore.echo.v1",
            "echo request is invalid",
            true,
            "use exocore.echo-request.v1 with 1 to 256 safe text bytes",
            &correlation,
        ));
    }
    let mut actor = ActorSupervisor::start();
    let message = actor.echo(request.message, &correlation)?;
    actor.shutdown()?;
    let trace = TraceEvent::local(
        "foundation.echo.completed",
        "exocore.echo.v1",
        &correlation,
        "ok",
        "bounded actor response completed",
    );
    Ok(FoundationEchoResponse {
        schema: "exocore.echo-response.v1",
        message,
        correlation_id: correlation,
        trace,
    })
}

fn runtime_lock_error(operation: &str) -> TypedError {
    TypedError::new(
        ErrorCode::Internal,
        operation,
        "foundation runtime is temporarily unavailable",
        true,
        "retry the operation",
        "runtime-lock",
    )
}

fn demonstration_manifest() -> ModuleManifest {
    ModuleManifest {
        schema: "exocore.module-mount.v1".into(),
        module_id: "foundation".into(),
        module_version: "0.1.0".into(),
        register: "register".into(),
        config_schema: "exocore.foundation.config.v1".into(),
        flag_declaration: FlagDeclaration {
            flag_id: "foundation.skeleton_ui".into(),
            default: false,
            owner: "foundation".into(),
            enabled_behavior: "local foundation route is visible".into(),
            disabled_behavior: "local foundation route is absent".into(),
        },
        routes: vec!["exocore.foundation-status.route.v1".into()],
        commands: vec![
            "exocore.foundation-status.command.v1".into(),
            "exocore.echo.command.v1".into(),
        ],
        contracts: vec!["exocore.foundation.v1".into()],
        config_keys: vec!["foundation.skeleton_ui".into()],
        health: "health".into(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn status_exercises_mount_flags_config_and_actor() {
        let status = status().unwrap();
        assert_eq!(status.schema, "exocore.foundation-status.v1");
        assert_eq!(status.default_authority, "deny");
        assert_eq!(status.source_roots, 0);
        assert_eq!(status.registered_modules, 1);
        assert!(!status.skeleton_ui_enabled);
        assert!(status.actor_healthy);
    }

    #[test]
    fn demonstration_flag_toggles_without_broadening_other_authority() {
        let mut runtime = FoundationRuntime::new().unwrap();
        assert!(!runtime.status().unwrap().skeleton_ui_enabled);
        assert!(runtime.set_skeleton_ui(true).unwrap().skeleton_ui_enabled);
        assert_eq!(runtime.status().unwrap().source_roots, 0);
        assert!(!runtime.set_skeleton_ui(false).unwrap().skeleton_ui_enabled);
    }

    #[test]
    fn echo_crosses_typed_actor_boundary() {
        let response = echo(FoundationEchoRequest {
            schema: "exocore.echo-request.v1".into(),
            message: "foundation-proof".into(),
        })
        .unwrap();
        assert_eq!(response.message, "foundation-proof");
        assert_eq!(response.trace.event, "foundation.echo.completed");
    }

    #[test]
    fn malformed_or_oversized_echo_fails_closed() {
        let invalid = echo(FoundationEchoRequest {
            schema: "unknown".into(),
            message: "x".into(),
        })
        .unwrap_err();
        assert_eq!(invalid.code, "E_VALIDATION");
        let oversized = echo(FoundationEchoRequest {
            schema: "exocore.echo-request.v1".into(),
            message: "x".repeat(257),
        });
        assert!(oversized.is_err());
        let bidi = echo(FoundationEchoRequest {
            schema: "exocore.echo-request.v1".into(),
            message: "safe\u{202e}hidden".into(),
        });
        assert!(bidi.is_err());
    }
}
