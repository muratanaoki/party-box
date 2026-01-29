# HTTP と HTTPS の仕組み

[← 目次に戻る](./02-aws.md)

---

## この章で学ぶこと

- HTTP の基本的な仕組み
- HTTPS と暗号化
- SSL 証明書の仕組み（なぜ必要か、どう機能するか）
- AWS での証明書管理

---

## 目次

1. [HTTP とは](#http-とは)
2. [HTTP のリクエストとレスポンス](#http-のリクエストとレスポンス)
3. [HTTPS とは](#https-とは)
4. [暗号化の基礎知識](#暗号化の基礎知識)
5. [SSL 証明書とは](#ssl-証明書とは)
6. [HTTPS 通信の流れ](#https-通信の流れ)
7. [HTTPS サービスを作るには](#https-サービスを作るには)
8. [AWS での証明書管理](#aws-での証明書管理)

---

## HTTP とは

**HTTP = HyperText Transfer Protocol**

Web ブラウザとサーバーが通信するための「約束事（プロトコル）」。

```mermaid
sequenceDiagram
    participant B as ブラウザ
    participant S as サーバー

    B->>S: リクエスト（このページください）
    S->>B: レスポンス（はい、どうぞ）
```

**ポイント:**

- ブラウザが「リクエスト」を送る
- サーバーが「レスポンス」を返す
- この繰り返しで Web が動いている

---

## HTTP のリクエストとレスポンス

### リクエストの構造

ブラウザが `https://example.com/api/users` にアクセスした時：

```http
GET /api/users HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0 ...
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

| 部分         | 説明           | 例                            |
| ------------ | -------------- | ----------------------------- |
| **メソッド** | 何をしたいか   | `GET`（取得）、`POST`（作成） |
| **パス**     | どのリソースか | `/api/users`                  |
| **ヘッダー** | 追加情報       | 認証、形式指定など            |
| **ボディ**   | 送信データ     | POST の時のデータ             |

### HTTP メソッド

| メソッド   | 用途               | 例                     |
| ---------- | ------------------ | ---------------------- |
| **GET**    | データ取得         | ユーザー一覧を取得     |
| **POST**   | データ作成         | 新しいユーザーを登録   |
| **PUT**    | データ更新（全体） | ユーザー情報を全て更新 |
| **PATCH**  | データ更新（部分） | 名前だけ更新           |
| **DELETE** | データ削除         | ユーザーを削除         |

### レスポンスの構造

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 123

{"users": [{"id": 1, "name": "田中"}]}
```

| 部分                 | 説明               |
| -------------------- | ------------------ |
| **ステータスコード** | 結果（200 = 成功） |
| **ヘッダー**         | メタ情報           |
| **ボディ**           | 実際のデータ       |

### ステータスコード

| コード  | 意味                  | よくある状況                   |
| ------- | --------------------- | ------------------------------ |
| **200** | OK                    | 正常終了                       |
| **201** | Created               | POST で作成成功                |
| **301** | Moved Permanently     | URL が変わった（リダイレクト） |
| **400** | Bad Request           | リクエストがおかしい           |
| **401** | Unauthorized          | 認証が必要                     |
| **403** | Forbidden             | 権限がない                     |
| **404** | Not Found             | ページが見つからない           |
| **500** | Internal Server Error | サーバーでエラー               |

**覚え方:**

- `2xx` = 成功
- `3xx` = リダイレクト
- `4xx` = クライアントのミス
- `5xx` = サーバーのミス

---

## HTTPS とは

**HTTPS = HTTP + Secure（暗号化）**

```mermaid
flowchart LR
    subgraph HTTP["HTTP（危険）"]
        H1["平文で送信"] --> H2["盗み見される"]
    end

    subgraph HTTPS["HTTPS（安全）"]
        S1["暗号化して送信"] --> S2["解読できない"]
    end
```

### HTTP の問題

HTTP は**平文（暗号化なし）** で通信する。

```mermaid
flowchart LR
    User["ユーザー"] -->|パスワード: password123| Attacker["盗聴者"]
    Attacker -->|丸見え！| Server["サーバー"]
```

**盗聴される例:**

- 公共 Wi-Fi で通信を傍受される
- 中間者攻撃（Man-in-the-Middle）

### HTTPS で解決

```mermaid
flowchart LR
    User["ユーザー"] -->|x8Kj2#mP9...| Attacker["盗聴者"]
    Attacker -->|意味不明...| Server["サーバー"]
```

→ 暗号化されているので、盗聴されても解読できない

---

## 暗号化の基礎知識

HTTPS の暗号化を理解するために、2 種類の暗号化方式を知っておこう。

### 共通鍵暗号（対称暗号）

**同じ鍵** で暗号化と復号化を行う。

```mermaid
flowchart LR
    subgraph 送信側
        P1["平文"] -->|鍵A で暗号化| C1["暗号文"]
    end

    C1 --> C2["暗号文"]

    subgraph 受信側
        C2 -->|鍵A で復号化| P2["平文"]
    end
```

| メリット | デメリット               |
| -------- | ------------------------ |
| 高速     | 鍵を安全に渡す方法がない |

**問題:** 最初に鍵をどうやって相手に渡す？
→ 鍵を送る通信も盗聴されたら終わり

### 公開鍵暗号（非対称暗号）

**2 つの鍵**（公開鍵と秘密鍵）を使う。

```mermaid
flowchart TB
    subgraph Keys["鍵ペア"]
        Pub["公開鍵<br/>（誰でも見れる）"]
        Priv["秘密鍵<br/>（自分だけ持つ）"]
    end

    Pub -.->|数学的に関連| Priv
```

**仕組み:**

- **公開鍵** で暗号化 → **秘密鍵** でしか復号化できない
- **秘密鍵** で署名 → **公開鍵** で検証できる

```mermaid
flowchart LR
    subgraph 送信側
        P1["平文"] -->|相手の公開鍵で暗号化| C1["暗号文"]
    end

    C1 --> C2["暗号文"]

    subgraph 受信側
        C2 -->|自分の秘密鍵で復号化| P2["平文"]
    end
```

| メリット             | デメリット                       |
| -------------------- | -------------------------------- |
| 鍵を安全に交換できる | 低速（共通鍵の 100-1000 倍遅い） |

### HTTPS では両方使う

1. **公開鍵暗号** で共通鍵を安全に交換
2. **共通鍵暗号** で実際のデータを暗号化

→ セキュリティと速度を両立

---

## SSL 証明書とは

### なぜ証明書が必要？

暗号化だけでは不十分。**相手が本物か確認する必要がある。**

```mermaid
flowchart TB
    subgraph Problem["証明書がない場合"]
        U1["ユーザー"] -->|暗号化通信| F["偽サイト<br/>（本物のふり）"]
        F -->|情報を盗む| A["攻撃者"]
    end
```

**中間者攻撃（Man-in-the-Middle）の例:**

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant A as 攻撃者（偽 Amazon）
    participant R as 本物の Amazon

    U->>A: Amazon にアクセス（と思ってる）
    Note over A: 攻撃者が間に入る
    A->>R: 本物に中継
    R->>A: 本物の応答
    A->>U: 改ざんして返す
    Note over U: クレカ情報を入力
    U->>A: クレカ情報送信
    Note over A: 情報を盗む！
```

**証明書があると:**

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant A as 攻撃者（偽 Amazon）

    U->>A: Amazon にアクセス
    A->>U: 偽の証明書を提示
    Note over U: ブラウザが証明書を検証
    Note over U: ❌ 証明書が不正！
    Note over U: 警告画面を表示
```

→ ブラウザが「このサイトは本物じゃない」と警告してくれる

### 証明書の役割

| 役割             | 説明                                 |
| ---------------- | ------------------------------------ |
| **身元証明**     | このサイトは本物の Amazon ですよ     |
| **公開鍵の配布** | 暗号化に使う公開鍵を安全に渡す       |
| **改ざん検知**   | 証明書が改ざんされていないことを保証 |

### 証明書の中身

```
┌─────────────────────────────────────┐
│         SSL 証明書                   │
├─────────────────────────────────────┤
│ 発行先: amazon.co.jp                 │  ← このドメイン用
│ 発行者: DigiCert Inc                 │  ← 認証局（CA）
│ 有効期限: 2024/01/01 - 2025/01/01   │
│ 公開鍵: MIIBIjANBgkqhkiG9w0B...     │  ← 暗号化に使う
│ 署名: SHA256withRSA...              │  ← CA の署名
└─────────────────────────────────────┘
```

| 項目                  | 説明                                 |
| --------------------- | ------------------------------------ |
| **発行先（Subject）** | 証明書の持ち主（ドメイン名）         |
| **発行者（Issuer）**  | 証明書を発行した認証局               |
| **有効期限**          | いつからいつまで有効か               |
| **公開鍵**            | サーバーの公開鍵                     |
| **署名**              | 認証局による「本物ですよ」という署名 |

### 認証局（CA）とは

**CA = Certificate Authority（認証局）**

「この証明書は本物ですよ」と保証する **信頼された第三者機関**。

```mermaid
flowchart TB
    subgraph CA["認証局（CA）"]
        Check["本人確認"]
        Sign["署名"]
    end

    Owner["サイト運営者"] -->|1. 証明書を申請| CA
    CA -->|2. 本人確認| Owner
    CA -->|3. 署名付き証明書を発行| Owner

    Owner -->|4. 証明書をサーバーに設置| Server["サーバー"]
```

**主な認証局:**
| 認証局 | 特徴 |
|--------|------|
| **Let's Encrypt** | 無料、自動更新、広く使われている |
| **DigiCert** | 大企業向け、高信頼 |
| **GlobalSign** | 日本企業に人気 |
| **AWS ACM** | AWS 専用、無料 |

### ブラウザに入っているのは「CA の証明書」だけ

**重要な区別:**

世の中には何億ものWebサイトがあるが、それぞれのサイトの証明書がブラウザに入っているわけではない。

```
┌─────────────────────────────────────────────────────────┐
│  ブラウザに入っているもの（約100〜150個）                 │
├─────────────────────────────────────────────────────────┤
│  ・DigiCert のルート証明書                               │
│  ・Let's Encrypt のルート証明書                          │
│  ・GlobalSign のルート証明書                             │
│  ・その他の認証局のルート証明書...                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ブラウザに入っていないもの（何億個）                     │
├─────────────────────────────────────────────────────────┤
│  ・Amazon の証明書                                       │
│  ・Google の証明書                                       │
│  ・party-box の証明書                                    │
│  ・その他全てのサイトの証明書...                          │
└─────────────────────────────────────────────────────────┘
```

**つまり:**

- **CA の証明書** → ブラウザ/OS にプリインストール（数十〜百数十個）
- **各サイトの証明書** → サーバーからその都度送られてくる（何億個）

CA が「このサイトは本物だよ」と署名しているので、CA さえ信頼できれば全てのサイトを検証できる仕組み。

### ルート証明書の確認方法

実際にブラウザ/OS で確認できる。

**Chrome の場合:**

```
設定 → プライバシーとセキュリティ → セキュリティ → 証明書の管理
```

**Mac の場合:**

```
キーチェーンアクセス → システムルート → 証明書
```

**Windows の場合:**

```
certmgr.msc → 信頼されたルート証明機関 → 証明書
```

開くと 100 個以上のルート証明書が入っているのが確認できる。

### 誰がルート証明書を入れているか

| ブラウザ             | ルート証明書の管理元       |
| -------------------- | -------------------------- |
| Chrome (Mac/Windows) | OS の証明書ストアを使う    |
| Chrome (Linux)       | 独自管理                   |
| Firefox              | 独自管理（Mozilla が管理） |
| Safari               | macOS の証明書ストアを使う |

Chrome をインストールした時点ではなく、**OS をインストールした時点**で主要なルート証明書がすでに入っている（Chrome on Mac/Windows の場合）。

### なぜ CA を信頼できる？

**ブラウザ/OS に「信頼する CA リスト」が内蔵されているから。**

```mermaid
flowchart TB
    subgraph Browser["ブラウザ"]
        List["信頼する CA リスト<br/>・DigiCert ✅<br/>・Let's Encrypt ✅<br/>・GlobalSign ✅"]
    end

    Cert["証明書<br/>発行者: DigiCert"] --> Check["リストにある？"]
    Check -->|Yes| OK["✅ 信頼できる"]
    Check -->|No| NG["❌ 警告を表示"]
```

**CA がリストに入るには:**

- 厳しいセキュリティ監査を受ける
- 各ブラウザ/OS ベンダーに申請する
- 基準を満たし続けないと削除される

だから CA は信頼できる（信頼できない CA はリストから削除される）。

**リストにない CA の証明書:**

```
⚠️ この接続ではプライバシーが保護されません
```

→ 自作の証明書（自己署名証明書）はブラウザに信頼されない

### 証明書チェーン（信頼の連鎖）

実際の証明書は「チェーン（連鎖）」になっている。

```mermaid
flowchart TB
    Root["ルート証明書<br/>（ブラウザに内蔵）"]
    Inter["中間証明書<br/>（CA が発行）"]
    Leaf["サーバー証明書<br/>（サイト用）"]

    Root -->|署名| Inter
    Inter -->|署名| Leaf

    style Root fill:#4caf50,color:#fff
    style Inter fill:#2196f3,color:#fff
    style Leaf fill:#ff9800
```

| 証明書             | 説明                                      |
| ------------------ | ----------------------------------------- |
| **ルート証明書**   | 最上位の CA。ブラウザに最初から入っている |
| **中間証明書**     | ルート CA が発行。日常的な発行を担当      |
| **サーバー証明書** | 実際のサイト用。中間 CA が発行            |

**なぜチェーン（階層）構造なのか？**

ルート認証局の秘密鍵は超重要。漏洩したら、その CA が発行した全ての証明書が信頼できなくなる。

だから：

```
ルート認証局（金庫で保管、オフライン、めったに使わない）
    ↓
    中間認証局を作って署名（これだけ1回やればOK）

中間認証局（日常業務用、オンライン）
    ↓
    Amazon とかの証明書を署名（日々の業務）
```

**たとえ話:**

```
社長（ルート）   ← 会社の信頼の源。普段は出てこない
    ↓ 権限委譲
部長（中間）     ← 社長から権限をもらっている
    ↓ 承認
契約書（サイト証明書）← 部長が承認した書類
```

「この契約書、部長が承認してる？」→「うん」
「その部長、社長から権限もらってる？」→「うん」
「じゃあ OK」

これがチェーンをたどるということ。

**セキュリティ上のメリット:**

- ルート CA の秘密鍵は金庫に保管（漏洩リスク最小化）
- 中間 CA が漏洩しても、ルートは無事（中間 CA だけ無効化すれば良い）
- 万が一ルート CA が漏洩したら大惨事（だから厳重に保管）

### HTTPS アクセス時の検証フロー

ユーザーが `https://amazon.co.jp` にアクセスした時、何が起きるか。

```mermaid
sequenceDiagram
    participant B as ブラウザ
    participant S as Amazon サーバー

    B->>S: HTTPS 接続したい
    S->>B: うちの証明書です（+中間証明書）
    Note over B: 証明書の検証開始
```

**ブラウザ内部での検証:**

```
1. 証明書を受け取る
   「amazon.co.jp の証明書です。DigiCert が署名しました」
        ↓
2. 署名者を確認
   「DigiCert って誰？信頼できる？」
        ↓
3. ルート証明書リストをチェック
   「DigiCert...あった！ブラウザに入ってる」
        ↓
4. 署名を検証
   「DigiCert のルート証明書の公開鍵で署名を検証...本物だ！」
        ↓
5. OK、信頼できる
   「この amazon.co.jp は本物」
```

```mermaid
sequenceDiagram
    participant B as ブラウザ
    participant S as サーバー

    S->>B: サーバー証明書 + 中間証明書
    Note over B: 1. サーバー証明書を中間証明書で検証
    Note over B: 2. 中間証明書をルート証明書で検証
    Note over B: 3. ルート証明書は内蔵リストで確認
    Note over B: ✅ 全部 OK → 信頼できる
    Note over B: 暗号化通信スタート！
```

**重要なポイント:**

- サーバーがルート証明書を持つ必要はない（ブラウザ側が持っている）
- サーバーは「俺は DigiCert に認められた amazon.co.jp だよ」と証明書を見せるだけ
- ブラウザが「DigiCert 知ってる、信頼する」となる

### ブラウザで証明書を確認してみよう

実際に Amazon や Google で確認できる。

1. サイトにアクセス
2. URL バーの鍵マークをクリック
3. 「証明書」や「接続がセキュア」をクリック
4. 証明書の詳細を見る

すると、証明書の階層構造（チェーン）が見える：

```
DigiCert Global Root CA          ← ルート証明書
  └── DigiCert SHA2 Extended...  ← 中間証明書
        └── amazon.co.jp         ← サーバー証明書
```

### 証明書の種類

| 種類                              | 検証レベル           | 用途             |
| --------------------------------- | -------------------- | ---------------- |
| **DV（Domain Validation）**       | ドメイン所有のみ確認 | 一般サイト、個人 |
| **OV（Organization Validation）** | 組織の実在確認       | 企業サイト       |
| **EV（Extended Validation）**     | 厳格な審査           | 銀行、EC サイト  |

**DV 証明書の取得（Let's Encrypt の例）:**

```mermaid
sequenceDiagram
    participant O as サイト運営者
    participant CA as Let's Encrypt
    participant S as サーバー

    O->>CA: example.com の証明書ください
    CA->>O: このファイルをサーバーに置いて
    O->>S: ファイルを配置
    CA->>S: http://example.com/.well-known/acme-challenge/xxx
    S->>CA: ファイルの内容を返す
    Note over CA: ドメインを所有していることを確認
    CA->>O: 証明書を発行
```

→ ドメインを所有していることだけを確認（組織の実在は確認しない）

---

## HTTPS 通信の流れ

実際に HTTPS で通信する時の流れ（TLS ハンドシェイク）。

### 全体の流れ

```mermaid
sequenceDiagram
    participant C as クライアント
    participant S as サーバー

    Note over C,S: 1. TLS ハンドシェイク
    C->>S: ClientHello（対応する暗号方式のリスト）
    S->>C: ServerHello（選んだ暗号方式）
    S->>C: Certificate（SSL 証明書）
    S->>C: ServerHelloDone

    Note over C: 証明書を検証
    Note over C: 共通鍵を生成

    C->>S: ClientKeyExchange（暗号化した共通鍵）
    C->>S: ChangeCipherSpec（これから暗号化）
    C->>S: Finished

    S->>C: ChangeCipherSpec
    S->>C: Finished

    Note over C,S: 2. 暗号化通信開始
    C->>S: 暗号化されたリクエスト
    S->>C: 暗号化されたレスポンス
```

### 簡略化した説明

```mermaid
flowchart LR
    subgraph Step1["1. 挨拶"]
        C1["クライアント"] -->|使える暗号方式は?| S1["サーバー"]
    end
```

```mermaid
flowchart LR
    subgraph Step2["2. 証明書の提示"]
        S2["サーバー"] -->|証明書です| C2["クライアント"]
        C2 -->|本物か確認| C2
    end
```

```mermaid
flowchart LR
    subgraph Step3["3. 鍵交換"]
        C3["クライアント"] -->|共通鍵（暗号化済み）| S3["サーバー"]
    end
```

```mermaid
flowchart LR
    subgraph Step4["4. 暗号化通信"]
        C4["クライアント"] <-->|共通鍵で暗号化| S4["サーバー"]
    end
```

**ポイント:**

1. 最初に証明書で「本物のサーバーか」を確認
2. 公開鍵暗号で「共通鍵」を安全に交換
3. 以降は高速な共通鍵暗号で通信

---

## HTTPS サービスを作るには

自分で Web サービスを作って HTTPS 対応したい場合、どうすればいいか。

### 基本的な流れ

```mermaid
flowchart LR
    A["1. CA に証明書を<br/>発行してもらう"] --> B["2. サーバーに<br/>証明書を設置"]
    B --> C["3. Web サーバーで<br/>HTTPS 設定"]
```

### 方法 1: 自分でやる（EC2 に直接置く場合）

Let's Encrypt（無料の CA）を使う例：

```mermaid
flowchart TB
    subgraph Step1["1. certbot をインストール"]
        C1["sudo apt install certbot"]
    end

    subgraph Step2["2. 証明書を取得"]
        C2["sudo certbot certonly --standalone -d example.com"]
    end

    subgraph Step3["3. 証明書が保存される"]
        C3["/etc/letsencrypt/live/example.com/<br/>├── fullchain.pem（証明書）<br/>└── privkey.pem（秘密鍵）"]
    end

    subgraph Step4["4. nginx に設定"]
        C4["server {<br/>  listen 443 ssl;<br/>  ssl_certificate /etc/...fullchain.pem;<br/>  ssl_certificate_key /etc/...privkey.pem;<br/>}"]
    end

    Step1 --> Step2 --> Step3 --> Step4
```

**注意点:**

- 証明書には有効期限がある（Let's Encrypt は 90 日）
- 自動更新の設定が必要（certbot が自動でやってくれる）
- サーバーの管理が必要

### 方法 2: AWS を使う（推奨）

ACM（AWS Certificate Manager）を使うと、証明書の発行・管理が自動化される。

```mermaid
flowchart TB
    subgraph Step1["1. ACM で証明書をリクエスト"]
        A1["AWS コンソールでドメイン入力"]
    end

    subgraph Step2["2. ドメイン所有を確認"]
        A2["DNS レコードを追加するだけ"]
    end

    subgraph Step3["3. ALB に適用"]
        A3["ALB のリスナーで証明書を選択"]
    end

    subgraph Done["完了！"]
        A4["・自動更新される<br/>・サーバーに証明書を置く必要なし<br/>・無料"]
    end

    Step1 --> Step2 --> Step3 --> Done
```

**ACM + ALB の場合、サーバーに証明書を置く必要がない！**

```mermaid
flowchart LR
    User["ユーザー"] ==>|HTTPS| ALB["ALB<br/>（証明書はここ）"]
    ALB -->|HTTP| ECS["ECS<br/>（証明書不要）"]

    style ALB fill:#ff9800
```

ALB が HTTPS の処理を全部やってくれる（SSL 終端）ので、ECS のコンテナは HTTP のまま で良い。

### 比較

| 項目             | 自分で管理            | AWS（ACM + ALB）           |
| ---------------- | --------------------- | -------------------------- |
| 証明書の取得     | certbot 等で取得      | AWS コンソールで数クリック |
| サーバーへの設置 | 手動で配置・設定      | 不要（ALB が管理）         |
| 有効期限の更新   | 自動更新の設定が必要  | 完全自動                   |
| コスト           | 無料（Let's Encrypt） | 無料（AWS サービス利用時） |
| 複雑さ           | やや複雑              | 簡単                       |

**結論:** AWS を使うなら ACM + ALB が圧倒的に楽。

---

## AWS での証明書管理

### ACM（AWS Certificate Manager）

AWS で SSL 証明書を管理するサービス。

```mermaid
flowchart LR
    ACM["ACM"] -->|証明書| ALB["ALB"]
    ACM -->|証明書| CF["CloudFront"]

    style ACM fill:#9c27b0,color:#fff
```

### ACM のメリット

| メリット     | 説明                           |
| ------------ | ------------------------------ |
| **無料**     | AWS サービスで使う分には無料   |
| **自動更新** | 有効期限が切れる前に自動で更新 |
| **簡単**     | 数クリックで発行               |
| **AWS 統合** | ALB, CloudFront にすぐ適用     |

### 証明書の発行手順

```mermaid
flowchart TB
    subgraph Step1["1. ACM で証明書をリクエスト"]
        Req["ドメイン名を入力<br/>example.com"]
    end

    subgraph Step2["2. ドメイン所有の確認"]
        DNS["DNS 検証<br/>（推奨）"]
        Email["メール検証"]
    end

    subgraph Step3["3. 検証完了"]
        Issued["証明書が発行される"]
    end

    subgraph Step4["4. ALB に適用"]
        Apply["リスナーで証明書を選択"]
    end

    Step1 --> Step2 --> Step3 --> Step4
```

### DNS 検証の仕組み

```mermaid
sequenceDiagram
    participant You as あなた
    participant ACM
    participant R53 as Route 53

    You->>ACM: example.com の証明書ください
    ACM->>You: この DNS レコードを追加して
    Note over ACM: _abc123.example.com → _xyz789.acm-validations.aws

    You->>R53: CNAME レコードを追加
    ACM->>R53: DNS レコードを確認
    R53->>ACM: レコードあります
    ACM->>You: ✅ 証明書を発行
```

**DNS 検証のメリット:**

- 一度設定すれば自動更新時も自動で検証
- メールを受け取る必要がない

### ALB への適用

```mermaid
flowchart TB
    subgraph ALB["ALB"]
        L443["リスナー :443<br/>（HTTPS）"]
        L80["リスナー :80<br/>（HTTP）"]
    end

    Cert["ACM 証明書"] --> L443
    L80 -->|リダイレクト| L443

    L443 --> TG["ターゲットグループ"]
```

**設定のポイント:**

1. HTTPS リスナー（443）に証明書を設定
2. HTTP リスナー（80）は HTTPS にリダイレクト
3. ALB より後ろは HTTP（SSL 終端）

### SSL 終端の再確認

```mermaid
flowchart LR
    subgraph Internet["インターネット"]
        User["ユーザー"]
    end

    subgraph AWS["AWS VPC"]
        ALB["ALB<br/>（SSL 終端）"]
        ECS["ECS"]
    end

    User ==>|HTTPS<br/>暗号化| ALB -->|HTTP<br/>平文| ECS

    style ALB fill:#ff9800
```

**Q: VPC 内が平文で大丈夫？**

→ VPC 内はインターネットから隔離されているので安全。
→ 暗号化が必要なら ALB → ECS 間も HTTPS にできる（通常は不要）。

---

## まとめ

| 項目               | ポイント                                   |
| ------------------ | ------------------------------------------ |
| **HTTP**           | ブラウザとサーバーの通信プロトコル         |
| **HTTPS**          | HTTP + 暗号化                              |
| **暗号化**         | 公開鍵暗号で鍵交換、共通鍵暗号でデータ通信 |
| **SSL 証明書**     | サーバーの身元証明 + 公開鍵の配布          |
| **認証局（CA）**   | 証明書を発行する信頼された第三者           |
| **証明書チェーン** | ルート → 中間 → サーバー証明書の信頼の連鎖 |
| **ACM**            | AWS の無料証明書サービス、自動更新対応     |

---

## 確認問題

### 問 1

> HTTPS を使うと何が保護される？

<details>
<summary>答え</summary>

1. **盗聴防止**: 通信内容が暗号化され、第三者に見られない
2. **改ざん防止**: データが途中で書き換えられていないことを保証
3. **なりすまし防止**: 証明書で相手が本物か確認できる

</details>

### 問 2

> SSL 証明書はなぜ必要？暗号化だけじゃダメ？

<details>
<summary>答え</summary>

暗号化だけでは「通信相手が本物か」を確認できない。

証明書がないと、攻撃者が偽サイトを作って暗号化通信しても、ユーザーは本物と区別できない（中間者攻撃）。

証明書があると、ブラウザが「このサイトは本物の amazon.co.jp ですよ」と確認できる。

</details>

### 問 3

> 「この接続ではプライバシーが保護されません」というエラーが出る原因は？

<details>
<summary>答え</summary>

- 証明書の有効期限が切れている
- 証明書のドメインが違う（example.com の証明書で test.com にアクセス）
- 認証局がブラウザに信頼されていない（自己署名証明書など）
- 証明書チェーンが不完全（中間証明書がない）

</details>

### 問 4

> SSL 終端とは？なぜ ALB で行う？

<details>
<summary>答え</summary>

**SSL 終端**: HTTPS の暗号化/復号化を ALB で行い、ALB より後ろは HTTP で通信すること。

**ALB で行う理由:**

- サーバーの負荷軽減（暗号化処理は重い）
- 証明書管理の一元化（サーバー10 台でも証明書は 1 つ）
- VPC 内は安全なので平文でも問題ない

</details>

---

[← 目次に戻る](./02-aws.md)
