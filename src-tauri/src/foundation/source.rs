use std::path::{Component, Path};

use super::config::SourceConfig;
use super::{ErrorCode, TypedError};

pub fn validate_utf8<'a>(bytes: &'a [u8], correlation_id: &str) -> Result<&'a str, TypedError> {
    std::str::from_utf8(bytes).map_err(|_| {
        TypedError::new(
            ErrorCode::Encoding,
            "exocore.source-content.v1",
            "source content is not valid UTF-8",
            false,
            "provide strict UTF-8 input",
            correlation_id,
        )
    })
}

pub fn validate_relative_locator(
    locator: &str,
    declared_size: usize,
    config: &SourceConfig,
    correlation_id: &str,
) -> Result<(), TypedError> {
    if declared_size > config.max_bytes {
        return Err(TypedError::new(
            ErrorCode::TooLarge,
            "exocore.source-locator.v1",
            "source exceeds the configured byte limit",
            false,
            "use a smaller bounded source",
            correlation_id,
        ));
    }
    let path = Path::new(locator);
    let unsafe_component = path.is_absolute()
        || path.components().any(|component| {
            matches!(
                component,
                Component::ParentDir | Component::RootDir | Component::Prefix(_)
            )
        });
    if unsafe_component {
        return Err(TypedError::new(
            ErrorCode::Traversal,
            "exocore.source-locator.v1",
            "source locator escapes its admitted relative boundary",
            false,
            "use a normalized relative locator under an explicitly admitted root",
            correlation_id,
        ));
    }
    if config.allowed_roots.is_empty() {
        return Err(TypedError::new(
            ErrorCode::Denied,
            "exocore.source-locator.v1",
            "no source roots are admitted by the current configuration",
            false,
            "configure a reviewed source adapter before reading",
            correlation_id,
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn traversal_and_unconfigured_roots_fail_closed() {
        let config = SourceConfig::default();
        assert_eq!(
            validate_relative_locator("../../secret", 1, &config, "c")
                .unwrap_err()
                .code,
            "E_TRAVERSAL"
        );
        assert_eq!(
            validate_relative_locator("fixture.json", 1, &config, "c")
                .unwrap_err()
                .code,
            "E_DENIED"
        );
    }

    #[test]
    fn invalid_utf8_fails_with_a_typed_error() {
        let error = validate_utf8(&[0xff, 0xfe], "c").unwrap_err();
        assert_eq!(error.code, "E_ENCODING");
    }

    #[test]
    fn size_is_checked_before_any_adapter() {
        let mut config = SourceConfig::default();
        config.allowed_roots.push("fixtures".into());
        assert_eq!(
            validate_relative_locator("fixture.json", config.max_bytes + 1, &config, "c")
                .unwrap_err()
                .code,
            "E_TOO_LARGE"
        );
    }
}
