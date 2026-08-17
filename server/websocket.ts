import http from "http"
import { WebSocketServer, WebSocket } from "ws"

export interface OrderUpdatePayload {
  event: string
  orderId: number
  status: string
  items?: any[]
}

let wss: WebSocketServer | null = null

export function initWebSocketServer(httpServer: http.Server): WebSocketServer {
  if (wss) {
    wss.close()
  }

  wss = new WebSocketServer({ server: httpServer })

  wss.on("connection", (ws: WebSocket) => {
    ws.on("error", (err) => {
      console.error("WebSocket client error:", err)
    })
  })

  return wss
}

export function broadcastOrderUpdate(payload: OrderUpdatePayload): void {
  if (!wss) return

  const message = JSON.stringify(payload)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

export function getConnectedClientsCount(): number {
  if (!wss) return 0
  let count = 0
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      count++
    }
  })
  return count
}

export function closeWebSocketServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!wss) {
      resolve()
      return
    }

    wss.clients.forEach((client) => {
      client.terminate()
    })

    wss.close(() => {
      wss = null
      resolve()
    })
  })
}
