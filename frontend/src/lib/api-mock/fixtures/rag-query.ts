import type { RetrievalMode } from '@/types/rag-console-types'

interface QueryRequest {
  query: string
  source_ids: string[]
  mode: RetrievalMode
  max_results: number
  include_evidence?: boolean
  timeout_seconds?: number
}

interface QueryResponse {
  answer: {
    summary: string
    code_snippets: Array<{
      repository: string
      path: string
      start_line: number
      end_line: number
      content: string
      language: string
    }>
  }
  source_metadata: {
    retrieval_mode: RetrievalMode
    execution_time_ms: number
    from_cache: boolean
  }
}

// 模拟代码片段数据库
const CODE_SNIPPETS_DB = {
  'signature-validation': {
    repository: 'payments-service',
    path: 'backend/app/validators/signature.py',
    start_line: 15,
    end_line: 28,
    content: `def validate_order_signature(order_id: str, signature: str) -> bool:
    """验证订单签名的有效性

    Args:
        order_id: 订单 ID
        signature: HMAC 签名

    Returns:
        签名是否有效
    """
    secret_key = get_secret_key()
    hasher = hmac.new(secret_key.encode(), order_id.encode(), hashlib.sha256)
    expected_signature = hasher.hexdigest()
    return hmac.compare_digest(signature, expected_signature)`,
    language: 'python',
  },
  'payment-processing': {
    repository: 'payments-service',
    path: 'backend/app/services/payment.py',
    start_line: 42,
    end_line: 58,
    content: `async def process_payment(order: Order, payment_method: PaymentMethod):
    """处理支付请求

    包含签名验证、金额校验、支付网关调用等步骤
    """
    # 验证订单签名
    if not validate_order_signature(order.id, order.signature):
        raise InvalidSignatureError("订单签名验证失败")

    # 验证订单金额
    if order.amount <= 0:
        raise InvalidAmountError("订单金额必须大于0")

    # 调用支付网关
    result = await payment_gateway.charge(
        amount=order.amount,
        method=payment_method
    )
    return result`,
    language: 'python',
  },
  'user-authentication': {
    repository: 'core-api',
    path: 'backend/app/auth/jwt.py',
    start_line: 20,
    end_line: 35,
    content: `def create_access_token(user_id: str, expires_delta: timedelta = None) -> str:
    """创建 JWT 访问令牌

    Args:
        user_id: 用户 ID
        expires_delta: 过期时间增量

    Returns:
        编码后的 JWT 令牌
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode = {"sub": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt`,
    language: 'python',
  },
}

// 生成回答摘要
function generateAnswerSummary(query: string, mode: RetrievalMode): string {
  const modeDesc = {
    graph: '基于知识图谱的关系分析',
    vector: '基于语义向量的相似度匹配',
    hybrid: '结合知识图谱和语义向量的混合检索',
  }[mode]

  // 根据查询关键词生成相关回答
  if (query.includes('签名') || query.includes('验证')) {
    return `## 订单签名验证实现

通过${modeDesc}，找到了订单签名验证的相关实现。

### 核心逻辑

订单签名验证主要在 \`payments-service\` 的 \`backend/app/validators/signature.py\` 中实现：

1. **签名生成**：使用 HMAC-SHA256 算法，基于订单 ID 和密钥生成签名
2. **签名比对**：使用 \`hmac.compare_digest\` 进行常量时间比较，防止时序攻击
3. **集成调用**：在 \`payment.py\` 的支付处理流程中首先进行签名验证

### 安全要点

- ✅ 使用 HMAC 而非简单 hash，保证签名不可伪造
- ✅ 使用常量时间比较，防止时序攻击
- ✅ 密钥通过 \`get_secret_key()\` 安全获取，不硬编码

### 相关代码

请参考下方代码片段了解具体实现细节。`
  }

  if (
    query.includes('认证') ||
    query.includes('JWT') ||
    query.includes('登录')
  ) {
    return `## JWT 认证实现

通过${modeDesc}，找到了 JWT 认证相关实现。

### 实现位置

JWT 令牌创建逻辑位于 \`core-api\` 的 \`backend/app/auth/jwt.py\`：

1. **令牌生成**：使用 \`jwt.encode\` 创建访问令牌
2. **过期控制**：默认 15 分钟过期，可自定义
3. **载荷结构**：包含用户 ID (\`sub\`) 和过期时间 (\`exp\`)

### 使用建议

- 访问令牌有效期短，建议配合刷新令牌使用
- 密钥 \`SECRET_KEY\` 必须保密，建议使用环境变量
- 算法使用 HS256，适合对称加密场景

请参考下方代码了解详细实现。`
  }

  // 默认通用回答
  return `## 查询结果

通过${modeDesc}，为您找到了相关的代码实现。

### 检索策略

- **检索模式**：${mode === 'graph' ? '知识图谱' : mode === 'vector' ? '语义向量' : '混合检索'}
- **匹配维度**：${mode === 'graph' ? '函数调用关系、模块依赖' : mode === 'vector' ? '语义相似度、上下文关联' : '多维度综合匹配'}

### 代码片段

以下代码片段根据查询相关性排序，请查看详细实现。`
}

// 根据查询选择相关代码片段
function selectRelevantSnippets(query: string, maxResults: number) {
  const snippets = []

  if (
    query.includes('签名') ||
    query.includes('验证') ||
    query.includes('订单')
  ) {
    snippets.push(CODE_SNIPPETS_DB['signature-validation'])
    snippets.push(CODE_SNIPPETS_DB['payment-processing'])
  }

  if (
    query.includes('认证') ||
    query.includes('JWT') ||
    query.includes('登录') ||
    query.includes('token')
  ) {
    snippets.push(CODE_SNIPPETS_DB['user-authentication'])
  }

  // 如果没有匹配，返回默认片段
  if (snippets.length === 0) {
    snippets.push(CODE_SNIPPETS_DB['signature-validation'])
  }

  return snippets.slice(0, maxResults)
}

export function executeRagQueryFixture(request: QueryRequest): QueryResponse {
  // 模拟查询延迟
  const executionTimeMs = Math.floor(Math.random() * 1000) + 500 // 500-1500ms

  // 选择相关代码片段
  const snippets = selectRelevantSnippets(request.query, request.max_results)

  // 生成回答摘要
  const summary = generateAnswerSummary(request.query, request.mode)

  // 模拟缓存命中（30% 概率）
  const fromCache = Math.random() < 0.3

  return {
    answer: {
      summary,
      code_snippets: snippets,
    },
    source_metadata: {
      retrieval_mode: request.mode,
      execution_time_ms: executionTimeMs,
      from_cache: fromCache,
    },
  }
}
