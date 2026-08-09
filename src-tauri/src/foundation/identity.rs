use sha2::{Digest, Sha256};

pub fn sha256_hex(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

pub fn correlation_id(operation: &str, payload: &[u8]) -> String {
    let mut material = operation.as_bytes().to_vec();
    material.push(0);
    material.extend_from_slice(payload);
    format!("corr-{}", &sha256_hex(&material)[..16])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identities_are_stable_and_operation_scoped() {
        assert_eq!(correlation_id("a", b"same"), correlation_id("a", b"same"));
        assert_ne!(correlation_id("a", b"same"), correlation_id("b", b"same"));
    }
}
