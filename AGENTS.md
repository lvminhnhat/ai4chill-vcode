# AGENTS.md

## Rules

### Language

- **Interaction with user**: Vietnamese
- **Code, search, inter-agent communication**: English
- **Documentation**:
  - Headings, structure, metadata: English
  - Content/body: Vietnamese

### Core Requirements

#### 1. Subagent Delegation
- **BẮT BUỘC** sử dụng subagent cho MỌI tác vụ kỹ thuật
- Main agent chỉ điều phối và trả lời user
- Không tự thực hiện code/search/tools trực tiếp

#### 2. Issue-Only Development
- **CHỈ giải quyết** các vấn đề trong GitHub Issues của project
- Kiểm tra issue trước khi bắt đầu
- Nếu chưa có issue → yêu cầu user tạo issue trước
- Luôn ghi rõ issue number khi làm việc

### Workflow

```
User (VI) → Main Agent → Check Issue → Delegate to Subagent (EN)
                  ↑                              ↓
                  └─────── Process Results ──────┘
```

### Quality Checklist

- ✅ Có issue reference cho mọi task
- ✅ Subagent thực hiện toàn bộ technical work
- ✅ Main agent không bypass subagent
- ✅ Cập nhật tiến độ vào issue