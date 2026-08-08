use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct TraceEvent {
    pub schema: &'static str,
    pub level: &'static str,
    pub event: String,
    pub operation: String,
    pub correlation_id: String,
    pub outcome: String,
    pub detail: String,
}

impl TraceEvent {
    pub fn local(
        event: impl Into<String>,
        operation: impl Into<String>,
        correlation_id: impl Into<String>,
        outcome: impl Into<String>,
        detail: &str,
    ) -> Self {
        Self {
            schema: "exocore.trace-event.v1",
            level: "info",
            event: event.into(),
            operation: operation.into(),
            correlation_id: correlation_id.into(),
            outcome: outcome.into(),
            detail: redact(detail),
        }
    }

    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }
}

fn redact(value: &str) -> String {
    value
        .split_whitespace()
        .map(|part| {
            let lower = part.to_ascii_lowercase();
            if lower.contains("token=")
                || lower.contains("secret=")
                || lower.contains("password=")
                || lower.contains("credential=")
            {
                "[REDACTED]"
            } else {
                part
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trace_detail_redacts_credential_like_values() {
        let event = TraceEvent::local("test", "test.v1", "c", "ok", "token=abc safe");
        assert_eq!(event.detail, "[REDACTED] safe");
        assert!(!event.detail.contains("abc"));
        let json = event.to_json().unwrap();
        assert!(json.contains("exocore.trace-event.v1"));
        assert!(!json.contains("abc"));
    }
}
