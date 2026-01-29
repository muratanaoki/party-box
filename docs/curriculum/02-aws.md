# 02. AWS 構成

## この章で学ぶこと

Party Box を AWS で本番運用するための構成を学ぶ。

## 目次

| ファイル | 内容 |
|----------|------|
| [02-aws-01-party-box.md](./02-aws-01-party-box.md) | Party Box の技術スタックと AWS 構成 |
| [02-aws-02-services.md](./02-aws-02-services.md) | AWS サービス解説（VPC, ECS, ALB, RDS, ECR） |
| [02-aws-http.md](./02-aws-http.md) | HTTP/HTTPS と SSL 証明書の仕組み |
| [02-aws-03-scaling.md](./02-aws-03-scaling.md) | スケーリングの仕組み |
| [02-aws-04-advanced.md](./02-aws-04-advanced.md) | 発展的な構成（EC サイトの例、CI/CD、IaC） |
| [02-aws-05-exercises.md](./02-aws-05-exercises.md) | 課題・チェックリスト・参考リソース |

## 全体像

```mermaid
flowchart TB
    User["ユーザー"]

    subgraph AWS["AWS Cloud"]
        subgraph Public["Public Subnet"]
            ALB["ALB"]
        end

        subgraph Private["Private Subnet"]
            subgraph ECS["ECS Cluster"]
                Next["Next.js"]
                Nest["NestJS"]
            end
            RDS["RDS"]
        end

        ECR["ECR"]
    end

    User -->|HTTPS| ALB
    ALB -->|/*| Next
    ALB -->|/api/*| Nest
    ALB -->|/socket.io/*| Nest
    Nest --> RDS

    style ALB fill:#ff9800
    style ECS fill:#2196f3
    style RDS fill:#4caf50
    style Next fill:#000,color:#fff
    style Nest fill:#e0234e,color:#fff
```

## 使用するサービス一覧

| サービス | 役割 |
|----------|------|
| **ALB** | リクエストをパスで振り分け |
| **ECS** | Docker コンテナを実行 |
| **ECR** | Docker イメージを保存 |
| **RDS** | PostgreSQL データベース |
| **VPC** | ネットワーク（Public/Private 分離） |
