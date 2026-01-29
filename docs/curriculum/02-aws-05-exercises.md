# 課題・チェックリスト

[← 目次に戻る](./02-aws.md) | [← 前へ: 発展](./02-aws-04-advanced.md)

---

## 課題 1: AWS アカウント作成

AWS を実際に触るための準備。

### 手順

1. **AWS アカウントを作成**
   - https://aws.amazon.com/ にアクセス
   - クレジットカードが必要（無料枠内なら課金なし）

2. **IAM ユーザーを作成**
   - ルートユーザー（メールアドレスでログイン）は普段使わない
   - 管理者権限の IAM ユーザーを作成して使う

3. **MFA を有効化**
   - ルートユーザーと IAM ユーザー両方に設定
   - Google Authenticator 等のアプリを使用

### なぜ IAM ユーザーを使う？

| ユーザー       | リスク                   | 対策               |
| -------------- | ------------------------ | ------------------ |
| ルートユーザー | 全権限、漏洩したら終わり | MFA + 普段使わない |
| IAM ユーザー   | 必要な権限のみ付与可能   | 日常作業はこちらで |

### 確認ポイント

- [ ] AWS アカウントを作成できた
- [ ] IAM ユーザーでログインできる
- [ ] MFA が設定されている

---

## 課題 2: 構成図を書く

Party Box を本番運用する場合の AWS 構成図を自分で書いてみよう。

### 要件

- ユーザーからのリクエストの流れがわかる
- 各サービスの役割がわかる
- Public/Private Subnet の区別がある

### ヒント

含めるべきサービス：

- VPC（Public/Private Subnet）
- ALB
- ECS（Next.js, NestJS）
- RDS
- ECR

### 発展

余裕があれば以下も追加してみよう：

- Route 53
- CloudFront + S3
- Auto Scaling の矢印
- セキュリティグループの境界

### 確認ポイント

- [ ] リクエストの流れが矢印で示されている
- [ ] 各サービスの役割を説明できる
- [ ] なぜその配置なのか理由を説明できる

---

## 課題 3: 料金見積もり

[AWS Pricing Calculator](https://calculator.aws/) で Party Box の月額コストを見積もる。

### 前提条件

| 項目       | 値                          |
| ---------- | --------------------------- |
| リージョン | ap-northeast-1（東京）      |
| ECS        | Fargate, 2 Service × 2 Task |
| RDS        | db.t3.micro, PostgreSQL     |
| ALB        | 1 台                        |
| データ転送 | 100 GB/月                   |

### 見積もる項目

1. **ECS (Fargate)**
   - vCPU: 0.25
   - メモリ: 0.5 GB
   - 24 時間 × 30 日 × 4 Task

2. **RDS**
   - db.t3.micro
   - ストレージ: 20 GB

3. **ALB**
   - LCU（Load Balancer Capacity Units）

4. **データ転送**
   - インターネットへのアウトバウンド

### 確認ポイント

- [ ] 各サービスの料金を理解している
- [ ] 合計の月額コストを計算できた
- [ ] どこにコストがかかっているか把握している

---

## 課題 4: ハンズオン（任意）

実際に AWS でリソースを作成してみよう。

### 注意事項

- **無料枠を確認** してから始める
- 終わったら **必ずリソースを削除** する
- 削除忘れで課金されることがあるので注意

### 最小構成で試す

1. **VPC を作成**
   - VPC ウィザードで「VPC など」を選択
   - Public/Private Subnet が自動作成される

2. **RDS を作成**
   - PostgreSQL, db.t3.micro
   - Private Subnet に配置

3. **ECS を作成**
   - Fargate で Task を 1 つ起動
   - 公式の nginx イメージで試す

4. **ALB を作成**
   - ECS の Task をターゲットに登録

5. **動作確認**
   - ALB の DNS 名にアクセス
   - nginx のページが表示されれば成功

6. **リソースを削除**
   - ECS Service → Cluster
   - ALB → Target Group
   - RDS
   - VPC

---

## 確認問題

### 問 1: VPC

> Private Subnet に配置したリソースがインターネットにアクセスするには何が必要？

<details>
<summary>答え</summary>

**NAT Gateway**

Private Subnet → NAT Gateway（Public Subnet）→ Internet Gateway → インターネット

</details>

### 問 2: ECS

> Fargate と EC2 の違いを説明してください

<details>
<summary>答え</summary>

| 項目         | Fargate    | EC2              |
| ------------ | ---------- | ---------------- |
| サーバー管理 | 不要       | 必要             |
| パッチ適用   | AWS が対応 | 自分で対応       |
| コスト       | やや高い   | 最適化で安くなる |
| 向いている   | 小〜中規模 | 大規模           |

</details>

### 問 3: ALB

> ALB の「SSL 終端」とは何ですか？

<details>
<summary>答え</summary>

HTTPS の暗号化/復号化を ALB で行い、ALB より後ろ（ECS 等）は HTTP（平文）で通信すること。

**メリット:**

- サーバーの負荷軽減
- 証明書管理の一元化
- VPC 内は安全なので平文で OK

</details>

### 問 4: スケーリング

> Auto Scaling の Target Tracking ポリシーとは？

<details>
<summary>答え</summary>

目標値（例: CPU 使用率 70%）を設定すると、AWS が自動でコンテナ数を調整して目標値を維持する仕組み。

設定がシンプルで、最も推奨されるポリシー。

</details>

### 問 5: 設計

> なぜ RDS を Private Subnet に置くのですか？

<details>
<summary>答え</summary>

セキュリティのため。

- DB はインターネットに公開する必要がない
- 外部から直接攻撃されるリスクを排除
- ECS からのみアクセスを許可（セキュリティグループで制御）

</details>

---

## チェックリスト

この章を終えたら、以下ができるようになっているか確認しよう。

### 基礎

- [ ] Party Box の技術スタック（Next.js + NestJS + PostgreSQL）を説明できる
- [ ] AWS 構成図を見て各サービスの役割を説明できる
- [ ] SSR と CSR の違いを説明できる

### VPC

- [ ] VPC、Subnet、Internet Gateway の関係を説明できる
- [ ] Public/Private Subnet の違いを説明できる
- [ ] セキュリティグループの役割を説明できる

### ECS

- [ ] Cluster, Service, Task, Task Definition の関係を説明できる
- [ ] Fargate と EC2 の違いを説明できる
- [ ] なぜ Task を複数動かすのか説明できる

### ALB

- [ ] ALB の役割（パスルーティング、負荷分散）を説明できる
- [ ] リバースプロキシとは何か説明できる
- [ ] SSL 終端とは何か説明できる

### スケーリング

- [ ] Auto Scaling の仕組みを説明できる
- [ ] Target Tracking ポリシーを説明できる
- [ ] クールダウン期間の目的を説明できる

### 発展

- [ ] CI/CD パイプラインの流れを説明できる
- [ ] IaC（Terraform/CloudFormation）の目的を説明できる

---

## 参考リソース

### 公式ドキュメント

- [AWS ドキュメント](https://docs.aws.amazon.com/ja_jp/)
- [AWS Well-Architected Framework](https://aws.amazon.com/jp/architecture/well-architected/)

### 学習リソース

- [AWS Skill Builder](https://skillbuilder.aws/) - 無料のトレーニング
- [AWS ハンズオン](https://aws.amazon.com/jp/getting-started/hands-on/) - 実践的なチュートリアル

### 料金

- [AWS 無料利用枠](https://aws.amazon.com/jp/free/)
- [AWS Pricing Calculator](https://calculator.aws/)

### コミュニティ

- [AWS 日本語ブログ](https://aws.amazon.com/jp/blogs/news/)
- [DevelopersIO（クラスメソッド）](https://dev.classmethod.jp/tags/aws/)
