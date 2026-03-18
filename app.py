import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="Task Management App")

TASKS_FILE = Path("tasks.json")


def load_tasks() -> list[dict]:
    if not TASKS_FILE.exists():
        return []
    with open(TASKS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_tasks(tasks: list[dict]) -> None:
    with open(TASKS_FILE, "w", encoding="utf-8") as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)


class ChatMessage(BaseModel):
    message: str


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None


# Claude client
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """あなたはタスク管理アシスタントです。
ユーザーのメッセージを解析して、タスクの情報を抽出してください。

ユーザーがタスクや課題について話したら、必ず save_task ツールを使ってタスクを保存してください。
タスクでない一般的な質問や挨拶には、通常のテキストで返答してください。

タスクの例:
- 「来週までにレポートを作成する必要がある」
- 「バグ修正：ログイン画面がクラッシュする」
- 「高優先度：クライアントへのメール送信」
"""


@app.post("/api/chat")
async def chat(body: ChatMessage):
    tasks = load_tasks()

    tools = [
        {
            "name": "save_task",
            "description": "タスク・課題を保存するツール。ユーザーがタスクや課題を報告した時に使用する。",
            "input_schema": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "タスクのタイトル（簡潔に）",
                    },
                    "description": {
                        "type": "string",
                        "description": "タスクの詳細説明",
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["high", "medium", "low"],
                        "description": "優先度。緊急・重要な場合はhigh、通常はmedium、急がない場合はlow",
                    },
                    "due_date": {
                        "type": "string",
                        "description": "期限（YYYY-MM-DD形式）。記載がない場合は空文字",
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "タスクに関連するタグ・カテゴリ",
                    },
                },
                "required": ["title", "description", "priority"],
            },
        }
    ]

    messages = [{"role": "user", "content": body.message}]

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        tools=tools,
        messages=messages,
    )

    saved_tasks = []
    reply_text = ""

    # Process response - handle tool use if present
    if response.stop_reason == "tool_use":
        tool_results = []
        for block in response.content:
            if block.type == "tool_use" and block.name == "save_task":
                task_data = block.input
                new_task = {
                    "id": str(uuid.uuid4()),
                    "title": task_data.get("title", ""),
                    "description": task_data.get("description", ""),
                    "priority": task_data.get("priority", "medium"),
                    "status": "todo",
                    "due_date": task_data.get("due_date", ""),
                    "tags": task_data.get("tags", []),
                    "created_at": datetime.now().isoformat(),
                }
                tasks.append(new_task)
                saved_tasks.append(new_task)
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": f"タスク「{new_task['title']}」を保存しました。ID: {new_task['id']}",
                    }
                )

        save_tasks(tasks)

        # Get Claude's final reply after tool execution
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})

        final_response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=tools,
            messages=messages,
        )
        for block in final_response.content:
            if block.type == "text":
                reply_text = block.text
                break
    else:
        for block in response.content:
            if block.type == "text":
                reply_text = block.text
                break

    return JSONResponse(
        {
            "reply": reply_text,
            "saved_tasks": saved_tasks,
        }
    )


@app.get("/api/tasks")
async def get_tasks():
    return load_tasks()


@app.patch("/api/tasks/{task_id}")
async def update_task(task_id: str, update: TaskUpdate):
    tasks = load_tasks()
    for task in tasks:
        if task["id"] == task_id:
            if update.status is not None:
                task["status"] = update.status
            if update.priority is not None:
                task["priority"] = update.priority
            if update.title is not None:
                task["title"] = update.title
            if update.description is not None:
                task["description"] = update.description
            if update.due_date is not None:
                task["due_date"] = update.due_date
            task["updated_at"] = datetime.now().isoformat()
            save_tasks(tasks)
            return task
    raise HTTPException(status_code=404, detail="Task not found")


@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    tasks = load_tasks()
    original_len = len(tasks)
    tasks = [t for t in tasks if t["id"] != task_id]
    if len(tasks) == original_len:
        raise HTTPException(status_code=404, detail="Task not found")
    save_tasks(tasks)
    return {"message": "Deleted"}


app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return FileResponse("static/index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
