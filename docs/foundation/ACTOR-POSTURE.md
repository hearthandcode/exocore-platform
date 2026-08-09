# Actor and supervision posture

The foundation uses bounded Rust actors only where message passing isolates mutable state or long-running work. `foundation::actor` provides one exercised echo actor behind an `ActorSupervisor`.

- The actor owns its receiver and no global state.
- Messages are typed and carry a one-shot reply channel.
- The supervisor owns the thread handle and health state.
- A closed mailbox returns `E_ACTOR`; callers never panic.
- Shutdown is explicit and bounded; dropping a supervisor requests shutdown and joins the worker.
- The demonstration actor has no filesystem, process, network, provider, Hub, or business authority.

The proof establishes construction, request/reply, health, and clean shutdown. Restart budgets, durable mailboxes, multi-actor trees, async runtimes, and feature business actors are deferred until a real workload supplies evidence. A feature actor will receive config, logger, clock, and repository ports at construction rather than using ambient singletons.
