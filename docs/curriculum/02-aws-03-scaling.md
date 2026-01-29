# Part 3: スケーリング

[← 目次に戻る](./02-aws.md) | [← 前へ: AWS サービス解説](./02-aws-02-services.md)

---

## この Part で学ぶこと

- スケーリングとは何か
- ECS での Auto Scaling の仕組み
- スケーリングポリシーの種類と設定

---

## スケーリングとは

負荷に応じてサーバー（コンテナ）の数を増減すること。

### スケールアップ vs スケールアウト

```mermaid
flowchart TB
    subgraph Up["スケールアップ（垂直）"]
        S1["小サーバー"] --> S2["大サーバー"]
    end

    subgraph Out["スケールアウト（水平）"]
        O1["サーバー1"]
        O2["サーバー1"] --> O3["サーバー1<br/>サーバー2<br/>サーバー3"]
    end
```

| 種類 | 説明 | メリット | デメリット |
|------|------|---------|-----------|
| **スケールアップ** | 1 台を強化 | 簡単 | 限界がある、ダウンタイム発生 |
| **スケールアウト** | 台数を増やす | 限界なし、無停止 | 設計が必要 |

→ ECS では **スケールアウト**（コンテナ数を増減）を使う

---

## Auto Scaling の仕組み

負荷に応じて自動でコンテナを増減する機能。

### 全体の流れ

```mermaid
flowchart LR
    CW["CloudWatch<br/>(監視)"] -->|閾値超過| AS["Auto Scaling<br/>(判断)"]
    AS -->|コンテナ追加| ECS["ECS<br/>(実行)"]
    ECS -->|自動登録| ALB["ALB<br/>(振り分け)"]
```

### 具体的な動き

**1. 通常時（Task 2 個）**
```mermaid
flowchart LR
    ALB["ALB"] --> T1["Task 1"]
    ALB --> T2["Task 2"]
```

**2. 負荷上昇 → スケールアウト（Task 4 個）**
```mermaid
flowchart LR
    ALB["ALB"] --> T1["Task 1"]
    ALB --> T2["Task 2"]
    ALB --> T3["Task 3 ✨"]
    ALB --> T4["Task 4 ✨"]
```

**3. 負荷減少 → スケールイン（Task 2 個に戻る）**
```mermaid
flowchart LR
    ALB["ALB"] --> T1["Task 1"]
    ALB --> T2["Task 2"]
```

---

## CloudWatch（監視）

AWS のリソースを監視するサービス。

### 監視できる主なメトリクス

| メトリクス | 説明 | 用途 |
|-----------|------|------|
| **CPUUtilization** | CPU 使用率 | 処理負荷の監視 |
| **MemoryUtilization** | メモリ使用率 | メモリ負荷の監視 |
| **RequestCount** | リクエスト数 | トラフィック量の監視 |
| **ResponseTime** | レスポンス時間 | パフォーマンス監視 |

### アラームの設定例

```mermaid
flowchart LR
    subgraph CloudWatch
        M["CPU 使用率"] -->|70% 超過が 3 分続く| A["アラーム発報"]
    end
    A --> AS["Auto Scaling 発動"]
```

---

## スケーリングポリシー

「どういう条件で、どれだけスケールするか」を定義するルール。

### 3 種類のポリシー

| ポリシー | 説明 | 使い所 |
|---------|------|-------|
| **Target Tracking** | 目標値を維持 | 最もシンプル、推奨 |
| **Step Scaling** | 段階的にスケール | 細かい制御が必要な場合 |
| **Scheduled Scaling** | 時間指定でスケール | 予測可能な負荷パターン |

### Target Tracking（推奨）

「CPU 使用率を 70% に保つ」のように目標を設定。AWS が自動で調整。

```mermaid
flowchart TB
    subgraph Target["Target Tracking"]
        G["目標: CPU 70%"]

        G --> C1["CPU 80% → コンテナ追加"]
        G --> C2["CPU 50% → コンテナ削減"]
    end
```

**設定例:**
```json
{
  "TargetTrackingScalingPolicyConfiguration": {
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }
}
```

| 項目 | 説明 |
|------|------|
| `TargetValue` | 目標 CPU 使用率（%） |
| `ScaleOutCooldown` | スケールアウト後の待機時間（秒） |
| `ScaleInCooldown` | スケールイン後の待機時間（秒） |

### Step Scaling

段階的にスケールする。細かい制御が必要な場合に使用。

```mermaid
flowchart TB
    subgraph Step["Step Scaling"]
        C1["CPU 70-80% → +1 Task"]
        C2["CPU 80-90% → +2 Tasks"]
        C3["CPU 90%+ → +3 Tasks"]
    end
```

**設定例:**
```
CPU 70-80%  → Task +1
CPU 80-90%  → Task +2
CPU 90%以上 → Task +3
```

### Scheduled Scaling

予測可能な負荷に対応。例：昼休みに負荷が増える。

```mermaid
flowchart LR
    subgraph Schedule["Scheduled Scaling"]
        A["9:00<br/>2 Tasks"] --> B["12:00<br/>4 Tasks"] --> C["14:00<br/>2 Tasks"]
    end
```

**設定例:**
```
毎日 12:00 → 最小 4 Tasks
毎日 14:00 → 最小 2 Tasks
```

---

## クールダウン期間

スケーリング後に一定時間待機する設定。

### なぜ必要？

```mermaid
sequenceDiagram
    participant CW as CloudWatch
    participant AS as Auto Scaling
    participant ECS as ECS

    CW->>AS: CPU 80%!
    AS->>ECS: Task 追加
    Note over ECS: 起動中...
    CW->>AS: まだ CPU 80%!
    AS->>ECS: さらに Task 追加
    Note over ECS: 起動中...
    Note over AS,ECS: Task 追加しすぎ！💸
```

**クールダウンがあると:**
```mermaid
sequenceDiagram
    participant CW as CloudWatch
    participant AS as Auto Scaling
    participant ECS as ECS

    CW->>AS: CPU 80%!
    AS->>ECS: Task 追加
    Note over AS: クールダウン 60秒
    CW->>AS: まだ CPU 80%!
    AS-->>AS: 待機中...
    Note over ECS: Task 起動完了
    CW->>AS: CPU 60%
    Note over AS: スケーリング不要
```

### 推奨設定

| 設定 | 推奨値 | 理由 |
|------|-------|------|
| **スケールアウト** | 60 秒 | 素早く対応したい |
| **スケールイン** | 300 秒 | 急な削減を避けたい |

---

## 最小・最大 Task 数

スケーリングの範囲を制限する設定。

```mermaid
flowchart LR
    subgraph Range["スケーリング範囲"]
        Min["最小: 2"] --- Current["現在: 3"] --- Max["最大: 10"]
    end
```

| 設定 | 推奨 | 理由 |
|------|------|------|
| **最小** | 2 | 冗長化のため最低 2 つは動かす |
| **最大** | 負荷に応じて | コスト上限を設ける |

**注意:** 最大を設定しないと、障害時に無限にスケールしてコストが爆発する可能性がある。

---

## Party Box での設定例

```mermaid
flowchart TB
    subgraph Frontend["Next.js Service"]
        F1["最小: 2"]
        F2["最大: 6"]
        F3["Target: CPU 70%"]
    end

    subgraph Backend["NestJS Service"]
        B1["最小: 2"]
        B2["最大: 10"]
        B3["Target: CPU 70%"]
    end
```

| Service | 最小 | 最大 | ポリシー |
|---------|------|------|---------|
| **Next.js** | 2 | 6 | Target Tracking (CPU 70%) |
| **NestJS** | 2 | 10 | Target Tracking (CPU 70%) |

**バックエンドの最大が多い理由:**
- WebSocket 接続を維持するため
- ゲームロジックの処理が重い

---

## スケーリングの監視

CloudWatch ダッシュボードで確認できる項目：

| 項目 | 確認内容 |
|------|---------|
| Task 数の推移 | スケーリングが適切に動作しているか |
| CPU/メモリ使用率 | リソースが不足していないか |
| リクエスト数 | トラフィックの変動パターン |
| エラー率 | スケーリング時に問題が起きていないか |

---

## まとめ

| 項目 | 内容 |
|------|------|
| **Auto Scaling** | 負荷に応じてコンテナを自動増減 |
| **Target Tracking** | 目標値を設定するだけでOK（推奨） |
| **クールダウン** | スケーリング後の待機時間を設定 |
| **最小/最大** | スケーリングの範囲を制限（コスト管理） |

---

[次へ: 発展 →](./02-aws-04-advanced.md)
