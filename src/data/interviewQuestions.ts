export interface InterviewQuestion {
  id: number;
  category: 'HTML' | 'CSS' | 'JavaScript' | 'React' | 'SQL' | 'Django' | 'Generative AI';
  question: string;
  canonicalAnswer: string;
  codeSnippet?: string;
  keywords: string[];
}

export const INTERVIEW_50_QUESTIONS: InterviewQuestion[] = [
  // --- HTML (1-5) ---
  {
    id: 1,
    category: 'HTML',
    question: 'What is the difference between async and defer in HTML?',
    canonicalAnswer:
      'Both allow scripts to download while HTML is being parsed. async executes as soon as downloading finishes, while defer executes after HTML parsing and preserves order among deferred classic scripts.',
    keywords: ['HTML parsing', 'download in background', 'async executes immediately', 'defer executes after parsing', 'order preserved'],
  },
  {
    id: 2,
    category: 'HTML',
    question: 'What is the DOM, and how does JavaScript use it?',
    canonicalAnswer:
      'DOM stands for Document Object Model. It represents HTML as a tree of objects that JavaScript can read and modify.',
    keywords: ['Document Object Model', 'tree structure', 'nodes/objects', 'read and modify HTML', 'document API'],
  },
  {
    id: 3,
    category: 'HTML',
    question: 'What is event delegation?',
    canonicalAnswer:
      'Event delegation means attaching one event listener to a parent element to handle events from multiple child elements.',
    keywords: ['parent listener', 'event bubbling', 'child elements', 'memory efficiency', 'e.target'],
  },
  {
    id: 4,
    category: 'HTML',
    question: 'How can you prevent Cross-Site Scripting (XSS)?',
    canonicalAnswer:
      'Avoid inserting untrusted content as HTML, sanitize HTML when necessary, encode output correctly, and implement a suitable Content Security Policy (CSP).',
    keywords: ['untrusted content', 'sanitize HTML', 'encode output', 'Content Security Policy (CSP)', 'avoid innerHTML'],
  },
  {
    id: 5,
    category: 'HTML',
    question: 'What is the difference between cookies and localStorage?',
    canonicalAnswer:
      'Cookies can be sent automatically with HTTP requests. localStorage stores data in the browser and does not automatically send it to the server.',
    keywords: ['sent with HTTP requests', 'browser storage only', 'expiration', 'storage capacity', 'HttpOnly'],
  },

  // --- CSS (6-10) ---
  {
    id: 6,
    category: 'CSS',
    question: 'What is CSS specificity?',
    canonicalAnswer:
      'Specificity helps determine which CSS selector wins when multiple rules target the same element. IDs generally have higher specificity than classes, and classes have higher specificity than element selectors.',
    keywords: ['selector weight', 'ID > class > element', 'cascading rules', '!important', 'inline styles'],
  },
  {
    id: 7,
    category: 'CSS',
    question: 'What is the difference between Flexbox and Grid?',
    canonicalAnswer:
      'Flexbox is mainly for one-dimensional layouts (row or column). Grid is designed for two-dimensional layouts (rows and columns).',
    keywords: ['one-dimensional', 'two-dimensional', 'row or column', 'rows and columns', 'layout models'],
  },
  {
    id: 8,
    category: 'CSS',
    question: 'Why might z-index not work?',
    canonicalAnswer:
      "The element may belong to a different stacking context, or an ancestor's stacking order may place the entire group behind another element, or position is static.",
    keywords: ['stacking context', 'ancestor stacking order', 'position static', 'opacity/transform triggers'],
  },
  {
    id: 9,
    category: 'CSS',
    question: 'What is the difference between relative, absolute, and fixed positioning?',
    canonicalAnswer:
      'relative keeps the element in normal flow and allows visual offsets. absolute removes it from normal flow and positions it relative to its nearest positioned ancestor. fixed positions it relative to the viewport.',
    keywords: ['relative: normal flow', 'absolute: removed from flow', 'nearest positioned ancestor', 'fixed: viewport'],
  },
  {
    id: 10,
    category: 'CSS',
    question: 'How do you make a website responsive?',
    canonicalAnswer:
      'Use flexible layouts, CSS Grid or Flexbox, relative units (rem, %, vh/vw), responsive images, and media queries.',
    keywords: ['media queries', 'Flexbox / Grid', 'relative units', 'responsive images', 'viewport meta'],
  },

  // --- JavaScript (11-18) ---
  {
    id: 11,
    category: 'JavaScript',
    question: 'What is a closure in JavaScript?',
    canonicalAnswer:
      'A closure allows a function to access variables from its outer scope even after the outer function has finished executing.',
    keywords: ['lexical scope', 'outer function scope', 'retained variables', 'inner function reference'],
  },
  {
    id: 12,
    category: 'JavaScript',
    question: 'What is the difference between var, let, and const?',
    canonicalAnswer:
      'var is function-scoped and hoisted. let and const are block-scoped. const prevents reassignment but does not make objects immutable.',
    keywords: ['function scope vs block scope', 'hoisting', 'temporal dead zone', 'const reassignment', 'mutation'],
  },
  {
    id: 13,
    category: 'JavaScript',
    question: 'What is the JavaScript event loop?',
    canonicalAnswer:
      'The event loop coordinates synchronous execution, queued tasks (macrotasks), and microtasks so asynchronous operations can be processed on a single thread.',
    keywords: ['call stack', 'microtask queue', 'task / macrotask queue', 'single thread', 'non-blocking I/O'],
  },
  {
    id: 14,
    category: 'JavaScript',
    question: 'What is the difference between Promise.all() and Promise.allSettled()?',
    canonicalAnswer:
      'Promise.all() rejects immediately when one of its input promises rejects. Promise.allSettled() waits for every input promise to settle and returns each outcome (fulfilled or rejected).',
    keywords: ['fail-fast', 'Promise.all rejects first error', 'Promise.allSettled waits for all', 'fulfilled/rejected objects'],
  },
  {
    id: 15,
    category: 'JavaScript',
    question: 'What is the difference between == and ===?',
    canonicalAnswer:
      '== allows type coercion in comparisons. === compares both value and type without implicit type coercion.',
    keywords: ['loose equality', 'strict equality', 'type coercion', 'value and type match'],
  },
  {
    id: 16,
    category: 'JavaScript',
    question: 'What is the difference between shallow copy and deep copy?',
    canonicalAnswer:
      'A shallow copy copies the outer object but shares nested object references. A deep copy duplicates nested data, creating independent copies.',
    keywords: ['nested references', 'Object.assign / spread operator', 'structuredClone / deep copy', 'reference mutation'],
  },
  {
    id: 17,
    category: 'JavaScript',
    question: 'What are debouncing and throttling?',
    canonicalAnswer:
      'Debouncing runs a function after repeated calls stop for a specified period (e.g., search autocomplete). Throttling limits how frequently a function can execute over time (e.g., window scroll/resize handler).',
    keywords: ['debounce waits for pause', 'throttle limits rate', 'search input', 'scroll / resize handler'],
  },
  {
    id: 18,
    category: 'JavaScript',
    question: 'What is the difference between call(), apply(), and bind()?',
    canonicalAnswer:
      'call() invokes a function immediately with individual comma-separated arguments. apply() invokes it immediately with an array of arguments. bind() returns a new function with a permanently configured this value.',
    keywords: ['call takes arg list', 'apply takes array', 'bind returns new function', 'this binding'],
  },

  // --- React (19-26) ---
  {
    id: 19,
    category: 'React',
    question: 'What is the Virtual DOM in React?',
    canonicalAnswer:
      'It is an in-memory representation of UI that React uses to calculate updates (reconciliation/diffing) and apply only the necessary changes to the actual real DOM.',
    keywords: ['in-memory UI tree', 'reconciliation', 'diffing algorithm', 'minimal real DOM updates', 'performance'],
  },
  {
    id: 20,
    category: 'React',
    question: 'What is the difference between props and state in React?',
    canonicalAnswer:
      'Props are read-only values passed to a component by its parent. State is internal data managed by a component that can trigger re-renders when updated.',
    keywords: ['props passed from parent (immutable)', 'state internal & mutable via setter', 'triggers re-render'],
  },
  {
    id: 21,
    category: 'React',
    question: 'What is the purpose of useEffect()?',
    canonicalAnswer:
      'It synchronizes a component with external systems, such as APIs, subscriptions, timers, or browser DOM. Its dependency array determines when the effect re-runs.',
    keywords: ['side effects', 'synchronization', 'dependency array', 'cleanup function', 'APIs/subscriptions'],
  },
  {
    id: 22,
    category: 'React',
    question: 'What is the difference between useMemo() and useCallback()?',
    canonicalAnswer:
      'useMemo() caches a calculated value across renders. useCallback() caches a function reference to prevent unnecessary child re-renders.',
    keywords: ['useMemo caches computed value', 'useCallback caches function reference', 'dependency array', 're-renders'],
  },
  {
    id: 23,
    category: 'React',
    question: 'What is prop drilling, and how can you avoid it?',
    canonicalAnswer:
      'Prop drilling means passing props through multiple intermediate components that do not need them. You can avoid it with React Context, component composition, or a state-management library (like Zustand or Redux).',
    keywords: ['intermediate components', 'React Context', 'component composition', 'state management library'],
  },
  {
    id: 24,
    category: 'React',
    question: 'Why are keys important in React lists?',
    canonicalAnswer:
      'Keys give list items stable identities across renders, helping React efficiently track insertions, removals, and reordering without re-creating all DOM nodes.',
    keywords: ['unique stable identity', 'reconciliation', 'list reordering', 'avoid index as key if order changes'],
  },
  {
    id: 25,
    category: 'React',
    question: 'What is the difference between controlled and uncontrolled components?',
    canonicalAnswer:
      'A controlled input gets its current value from React state and updates via an onChange handler. An uncontrolled input keeps its value in the DOM and is accessed using a ref.',
    keywords: ['controlled by React state', 'uncontrolled in DOM via useRef', 'single source of truth', 'onChange handler'],
  },
  {
    id: 26,
    category: 'React',
    question: 'How do you optimize React performance?',
    canonicalAnswer:
      'Profile the app with React DevTools, avoid unnecessary re-renders with React.memo/useCallback/useMemo, use stable keys, split large components, and lazy-load routes with React.lazy and Suspense.',
    keywords: ['React DevTools profiler', 'React.memo / useMemo', 'code splitting / lazy loading', 'stable keys', 'windowing/virtualization'],
  },

  // --- SQL (27-33) ---
  {
    id: 27,
    category: 'SQL',
    question: 'What is the difference between WHERE and HAVING in SQL?',
    canonicalAnswer:
      'WHERE filters individual rows before grouping. HAVING filters groups after aggregation with GROUP BY.',
    keywords: ['WHERE filters rows before GROUP BY', 'HAVING filters aggregate results', 'aggregate functions (COUNT, SUM)'],
  },
  {
    id: 28,
    category: 'SQL',
    question: 'What is the difference between INNER JOIN and LEFT JOIN?',
    canonicalAnswer:
      'INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table and matching rows from the right table, filling with NULL values when there is no match.',
    keywords: ['INNER JOIN: only matches', 'LEFT JOIN: all left + matches or NULL', 'foreign keys', 'cartesian join'],
  },
  {
    id: 29,
    category: 'SQL',
    question: 'What is database normalization?',
    canonicalAnswer:
      'Normalization organizes database tables into structured relations to minimize data redundancy and prevent insertion, update, and deletion anomalies (1NF, 2NF, 3NF, BCNF).',
    keywords: ['reduce redundancy', 'data integrity', '1NF, 2NF, 3NF', 'prevent update anomalies', 'foreign keys'],
  },
  {
    id: 30,
    category: 'SQL',
    question: 'What is an index in SQL?',
    canonicalAnswer:
      'An index is a data structure (typically B-tree) that speeds up data retrieval on specified columns, at the expense of extra storage and slower write operations (INSERT, UPDATE, DELETE).',
    keywords: ['B-tree structure', 'speeds up SELECT/WHERE', 'write overhead', 'clustered vs non-clustered index'],
  },
  {
    id: 31,
    category: 'SQL',
    question: 'What are the ACID properties in database transactions?',
    canonicalAnswer:
      'Atomicity: All-or-nothing execution. Consistency: Database rules and constraints remain valid. Isolation: Concurrent transactions do not interfere. Durability: Committed changes survive system failures.',
    keywords: ['Atomicity (all or nothing)', 'Consistency (valid rules)', 'Isolation (concurrency)', 'Durability (persisted on disk)'],
  },
  {
    id: 32,
    category: 'SQL',
    question: 'What is the difference between a primary key and a foreign key?',
    canonicalAnswer:
      'A primary key uniquely identifies each row in a table and cannot contain NULLs. A foreign key references a primary key in another table to enforce referential integrity between tables.',
    keywords: ['primary key: unique row identifier', 'foreign key: references another table', 'referential integrity', 'no NULL in PK'],
  },
  {
    id: 33,
    category: 'SQL',
    question: 'What is a window function in SQL?',
    canonicalAnswer:
      'A window function performs calculations across related sets of rows (partitions) without collapsing them into a single row like GROUP BY does (e.g., ROW_NUMBER(), RANK(), SUM() OVER).',
    codeSnippet: 'SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS salary_rank FROM employees;',
    keywords: ['OVER clause', 'PARTITION BY', 'ORDER BY', 'does not collapse rows', 'RANK(), ROW_NUMBER()'],
  },

  // --- Django (34-40) ---
  {
    id: 34,
    category: 'Django',
    question: 'What is Django?',
    canonicalAnswer:
      'Django is a high-level Python web framework that encourages rapid development and clean design, providing built-in ORM, authentication, routing, and an admin interface.',
    keywords: ['Python web framework', 'batteries included', 'admin panel', 'ORM', 'authentication and routing'],
  },
  {
    id: 35,
    category: 'Django',
    question: "Explain Django's MVT architecture.",
    canonicalAnswer:
      'MVT stands for Model-View-Template. Model handles data structure and database queries. View processes HTTP requests and business logic. Template handles HTML rendering and UI presentation.',
    keywords: ['Model (data/database)', 'View (business logic)', 'Template (HTML UI)', 'controller handled by Django'],
  },
  {
    id: 36,
    category: 'Django',
    question: 'What is Django ORM?',
    canonicalAnswer:
      'Django ORM (Object-Relational Mapper) lets developers query, filter, create, and update database records using Python objects and methods instead of writing raw SQL queries.',
    codeSnippet: 'Product.objects.filter(price__gt=1000)',
    keywords: ['Object-Relational Mapping', 'QuerySet', 'filter/exclude/get', 'Python objects instead of raw SQL'],
  },
  {
    id: 37,
    category: 'Django',
    question: 'What are Django migrations and what are the main commands?',
    canonicalAnswer:
      'Migrations are Django’s way of propagating changes made in models.py (like adding fields or tables) into database schema. Key commands: python manage.py makemigrations and python manage.py migrate.',
    codeSnippet: 'python manage.py makemigrations\npython manage.py migrate',
    keywords: ['makemigrations', 'migrate', 'schema sync', 'model changes', 'version control for database'],
  },
  {
    id: 38,
    category: 'Django',
    question: 'What is middleware in Django?',
    canonicalAnswer:
      'Middleware is a framework of hooks into Django’s request/response processing lifecycle. It processes incoming requests before views run, and outgoing responses after views execute (e.g., authentication, CORS, CSRF, logging).',
    keywords: ['request/response hook', 'global processing', 'security/authentication', 'CORS/CSRF', '__call__ method'],
  },
  {
    id: 39,
    category: 'Django',
    question: 'How does Django protect against Cross-Site Request Forgery (CSRF)?',
    canonicalAnswer:
      'Django uses CSRF tokens. It injects a unique secret token in forms ({% csrf_token %}) or cookies, and validates this token against incoming POST/PUT/DELETE requests via CsrfViewMiddleware.',
    keywords: ['{% csrf_token %}', 'CsrfViewMiddleware', 'token validation', 'unsafe HTTP methods (POST/PUT/DELETE)'],
  },
  {
    id: 40,
    category: 'Django',
    question: 'How do you improve Django application performance?',
    canonicalAnswer:
      'Use select_related() for ForeignKey relationships (single JOIN) and prefetch_related() for ManyToMany (separate batch query) to prevent N+1 queries; add database indexes; use caching (Redis); paginate large querysets; and profile slow queries.',
    keywords: ['select_related (JOIN)', 'prefetch_related (batch)', 'prevent N+1 queries', 'database indexing', 'Redis cache'],
  },

  // --- Generative AI (41-50) ---
  {
    id: 41,
    category: 'Generative AI',
    question: 'What is Generative AI?',
    canonicalAnswer:
      'Generative AI creates new content, such as text, images, audio, video, or code, based on patterns and representations learned from vast training data.',
    keywords: ['creates new content', 'text, code, images', 'deep learning models', 'pattern synthesis'],
  },
  {
    id: 42,
    category: 'Generative AI',
    question: 'What is a Large Language Model (LLM)?',
    canonicalAnswer:
      'An LLM is a transformer-based neural network trained on massive text datasets to understand, process, and generate natural human language and code.',
    keywords: ['Transformer architecture', 'massive training data', 'next-token prediction', 'natural language & code'],
  },
  {
    id: 43,
    category: 'Generative AI',
    question: 'What is a token in LLMs?',
    canonicalAnswer:
      'A token is a fundamental chunk of text (word, subword, or character) that the model processes. Context windows, latency, and API costs are measured in tokens.',
    keywords: ['text chunk (word or subword)', 'context window limit', 'tokenization (BPE)', 'pricing metric'],
  },
  {
    id: 44,
    category: 'Generative AI',
    question: 'What is prompt engineering?',
    canonicalAnswer:
      'Prompt engineering is the practice of crafting instructions, context, few-shot examples, system constraints, and output schemas to guide an LLM toward accurate, reliable responses.',
    keywords: ['system instruction', 'few-shot prompting', 'chain-of-thought', 'output schema', 'guardrails'],
  },
  {
    id: 45,
    category: 'Generative AI',
    question: 'What is Retrieval-Augmented Generation (RAG)?',
    canonicalAnswer:
      'RAG combines an external knowledge base with an LLM. Relevant documents are retrieved from a vector database or search index and passed as context in the prompt so the LLM generates grounded, accurate answers.',
    keywords: ['external knowledge base', 'retrieval + prompt injection', 'vector search', 'grounded answers', 'reduces hallucination'],
  },
  {
    id: 46,
    category: 'Generative AI',
    question: 'What are embeddings in AI?',
    canonicalAnswer:
      'Embeddings are dense numerical vector representations of text or images where semantically similar concepts are positioned near each other in a high-dimensional vector space.',
    keywords: ['vector representations', 'semantic similarity', 'cosine distance', 'high-dimensional space'],
  },
  {
    id: 47,
    category: 'Generative AI',
    question: 'What is a vector database?',
    canonicalAnswer:
      'A vector database stores and indexes high-dimensional vector embeddings for fast nearest-neighbor similarity searches (using algorithms like HNSW or IVF) to power RAG systems (e.g., pgvector, Pinecone, Chroma).',
    keywords: ['stores embeddings', 'nearest neighbor search (HNSW)', 'cosine similarity', 'RAG retrieval', 'pgvector'],
  },
  {
    id: 48,
    category: 'Generative AI',
    question: 'What are hallucinations in LLMs and how can you reduce them?',
    canonicalAnswer:
      'Hallucinations are confident but factually incorrect or fabricated statements generated by an LLM. They can be reduced by using RAG with citations, clear grounding system instructions, lowering temperature, and adding verification guardrails.',
    keywords: ['factually incorrect outputs', 'grounding with RAG', 'lower temperature', 'strict system prompt', 'output verification'],
  },
  {
    id: 49,
    category: 'Generative AI',
    question: 'What is fine-tuning in LLMs?',
    canonicalAnswer:
      'Fine-tuning takes a pre-trained base model and continues training it on a specialized, curated dataset to adapt the model’s tone, formatting, domain-specific terminology, or task-specific performance (e.g., LoRA).',
    keywords: ['updates model weights', 'domain adaptation', 'LoRA / parameter-efficient', 'curated dataset'],
  },
  {
    id: 50,
    category: 'Generative AI',
    question: 'What is the difference between RAG and fine-tuning?',
    canonicalAnswer:
      'RAG injects dynamic external knowledge into the prompt at query time without altering model weights, ideal for up-to-date private documents. Fine-tuning modifies model weights to teach style, vocabulary, or specialized behaviors, but is static and expensive to update.',
    keywords: ['RAG: dynamic runtime retrieval without weight changes', 'Fine-tuning: weight update for style/task', 'cost & freshness comparison'],
  },
];

export const CATEGORIES = [
  'All',
  'HTML',
  'CSS',
  'JavaScript',
  'React',
  'SQL',
  'Django',
  'Generative AI',
] as const;
