use crate::scheduler::queue::QueueItem;
use std::sync::Mutex;

#[derive(Default)]
pub struct SchedulerEngineState {
    pub is_running: bool,
    pub active_queue: Mutex<Vec<QueueItem>>,
}

impl SchedulerEngineState {
    pub fn new() -> Self {
        Self {
            is_running: true,
            active_queue: Mutex::new(Vec::new()),
        }
    }
}
