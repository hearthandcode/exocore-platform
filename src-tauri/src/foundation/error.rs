use serde::Serialize;
use std::fmt::{Display, Formatter};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    Validation,
    Denied,
    Traversal,
    TooLarge,
    Encoding,
    Unregistered,
    Disabled,
    Config,
    Actor,
    Internal,
}

impl ErrorCode {
    pub const fn stable_code(self) -> &'static str {
        match self {
            Self::Validation => "E_VALIDATION",
            Self::Denied => "E_DENIED",
            Self::Traversal => "E_TRAVERSAL",
            Self::TooLarge => "E_TOO_LARGE",
            Self::Encoding => "E_ENCODING",
            Self::Unregistered => "E_UNREGISTERED",
            Self::Disabled => "E_DISABLED",
            Self::Config => "E_CONFIG",
            Self::Actor => "E_ACTOR",
            Self::Internal => "E_INTERNAL",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct TypedError {
    pub schema: &'static str,
    pub code: &'static str,
    pub message: Box<str>,
    pub operation: Box<str>,
    pub recoverable: bool,
    pub suggested_action: Box<str>,
    pub correlation_id: Box<str>,
}

impl TypedError {
    pub fn new(
        code: ErrorCode,
        operation: impl Into<String>,
        message: impl Into<String>,
        recoverable: bool,
        suggested_action: impl Into<String>,
        correlation_id: impl Into<String>,
    ) -> Self {
        Self {
            schema: "exocore.typed-error.v1",
            code: code.stable_code(),
            message: message.into().into_boxed_str(),
            operation: operation.into().into_boxed_str(),
            recoverable,
            suggested_action: suggested_action.into().into_boxed_str(),
            correlation_id: correlation_id.into().into_boxed_str(),
        }
    }
}

impl Display for TypedError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}: {}", self.code, self.message)
    }
}

impl std::error::Error for TypedError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn error_serialization_uses_stable_safe_shape() {
        let error = TypedError::new(
            ErrorCode::Denied,
            "foundation.test.v1",
            "capability denied",
            false,
            "request an explicit capability",
            "test-correlation",
        );
        let value = serde_json::to_value(error).expect("serialize typed error");
        assert_eq!(value["schema"], "exocore.typed-error.v1");
        assert_eq!(value["code"], "E_DENIED");
        assert!(value.get("internal").is_none());
    }
}
