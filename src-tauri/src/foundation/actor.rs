use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc};
use std::thread::{self, JoinHandle};
use std::time::Duration;

use super::{ErrorCode, TypedError};

enum ActorMessage {
    Echo {
        value: String,
        reply: mpsc::Sender<String>,
    },
    Shutdown,
}

pub struct ActorSupervisor {
    sender: mpsc::Sender<ActorMessage>,
    healthy: Arc<AtomicBool>,
    handle: Option<JoinHandle<()>>,
}

impl ActorSupervisor {
    pub fn start() -> Self {
        let (sender, receiver) = mpsc::channel();
        let healthy = Arc::new(AtomicBool::new(true));
        let actor_health = Arc::clone(&healthy);
        let handle = thread::spawn(move || {
            while let Ok(message) = receiver.recv() {
                match message {
                    ActorMessage::Echo { value, reply } => {
                        let _ = reply.send(value);
                    }
                    ActorMessage::Shutdown => break,
                }
            }
            actor_health.store(false, Ordering::Release);
        });
        Self {
            sender,
            healthy,
            handle: Some(handle),
        }
    }

    pub fn echo(&self, value: String, correlation_id: &str) -> Result<String, TypedError> {
        let (reply, response) = mpsc::channel();
        self.sender
            .send(ActorMessage::Echo { value, reply })
            .map_err(|_| actor_error("actor mailbox is closed", correlation_id))?;
        response
            .recv_timeout(Duration::from_secs(1))
            .map_err(|_| actor_error("actor reply timed out", correlation_id))
    }

    pub fn is_healthy(&self) -> bool {
        self.healthy.load(Ordering::Acquire)
    }

    pub fn shutdown(&mut self) -> Result<(), TypedError> {
        let _ = self.sender.send(ActorMessage::Shutdown);
        if let Some(handle) = self.handle.take() {
            handle
                .join()
                .map_err(|_| actor_error("actor did not shut down cleanly", "shutdown"))?;
        }
        Ok(())
    }
}

impl Drop for ActorSupervisor {
    fn drop(&mut self) {
        let _ = self.sender.send(ActorMessage::Shutdown);
        if let Some(handle) = self.handle.take() {
            let _ = handle.join();
        }
    }
}

fn actor_error(message: &str, correlation_id: &str) -> TypedError {
    TypedError::new(
        ErrorCode::Actor,
        "exocore.actor.v1",
        message,
        true,
        "restart the bounded actor and retry",
        correlation_id,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn supervised_actor_echoes_and_shuts_down_cleanly() {
        let mut supervisor = ActorSupervisor::start();
        assert!(supervisor.is_healthy());
        assert_eq!(supervisor.echo("proof".into(), "c").unwrap(), "proof");
        supervisor.shutdown().unwrap();
        assert!(!supervisor.is_healthy());
    }
}
