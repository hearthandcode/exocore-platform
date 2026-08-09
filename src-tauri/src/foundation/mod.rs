pub mod actor;
pub mod authority;
pub mod config;
pub mod error;
pub mod flags;
pub mod identity;
pub mod ipc;
pub mod module_registry;
pub mod source;
pub mod telemetry;

pub use error::{ErrorCode, TypedError};
pub use ipc::{FoundationEchoRequest, FoundationEchoResponse, FoundationStatus};
