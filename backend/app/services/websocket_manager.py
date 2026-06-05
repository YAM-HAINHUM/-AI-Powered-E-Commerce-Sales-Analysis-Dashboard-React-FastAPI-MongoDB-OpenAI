from fastapi import WebSocket
from typing import List, Dict, Any
from datetime import datetime


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_channels: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Connection might be closed, clean up later or ignore
                pass

    async def connect_user(self, websocket: WebSocket, user_id: str):
        """Connect WebSocket for specific user channel."""
        await websocket.accept()
        if user_id not in self.user_channels:
            self.user_channels[user_id] = []
        self.user_channels[user_id].append(websocket)

    async def send_to_user(self, user_id: str, message: dict):
        """Send message to all connections of a specific user."""
        connections = self.user_channels.get(user_id, [])
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

    async def broadcast_user_activity(self, user_id: str, activity: Dict[str, Any]):
        """Broadcast user activity to user's channel in real-time."""
        await self.send_to_user(user_id, {
            "type": "user_activity",
            "timestamp": datetime.utcnow().isoformat(),
            "activity": activity
        })


manager = ConnectionManager()
