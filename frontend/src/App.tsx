import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Download,
  FileChartColumn,
  FlaskConical,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Moon,
  Plus,
  Radar,
  Search,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Papa from "papaparse";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";

type Sentiment = "Positive" | "Neutral" | "Negative";
type Feedback = {
  id: string;
  customer: string;
  text: string;
  category: string;
  sentiment: Sentiment;
  date: string;
  source: string;
};
type CsvPreviewRow = {
  rowNumber: number;
  feedback: Feedback;
  duplicateReason?: string;
};

type FeedbackAnalysis = {
  sentiment?: Sentiment;
  category?: string;
  urgency?: string;
  topics?: string[];
  rationale?: string;
  root_cause?: string;
  customer_impact?: string;
  evidence_quotes?: string[];
  recommended_actions?: string[];
  confidence?: number;
  model?: string;
  analyzed_at?: string;
};

type BulkAnalysisProgress = {
  running: boolean;
  total: number;
  completed: number;
  skipped: number;
  failed: number;
  currentId: string;
};

type AdaptionConnectionStatus = {
  sdk_installed?: boolean;
  api_key_configured?: boolean;
  connected?: boolean;
  inference_ready?: boolean;
  available_base_models?: number;
  message?: string;
};

type AdaptionReviewReadiness = {
  total_feedback?: number;
  analyzed_feedback?: number;
  verified_examples?: number;
  stale_reviews?: number;
  minimum_reference_rows_for_sft?: number;
  additional_verified_examples_needed?: number;
  reference_count_satisfied?: boolean;
  training_started?: boolean;
  message?: string;
};

type AdaptionUploadEstimate = {
  dataset_id?: string;
  dataset_name?: string;
  record_count?: number;
  estimated_credits_consumed?: number | null;
  estimated_minutes?: number | null;
  estimate_available?: boolean;
  uploaded_to_adaption?: boolean;
  training_started?: boolean;
  adaptation_started?: boolean;
  optimization_started?: boolean;
  optimization_run_id?: string | null;
  optimization_status?: string | null;
  reused_existing_dataset?: boolean;
  status?: string;
  estimate_error_type?: string;
  message?: string;
};

type AdaptionOptimizationStatus = {
  dataset_id?: string;
  run_id?: string | null;
  status?: string | null;
  optimization_started?: boolean;
  last_status_check?: string;
  message?: string;
};

type Issue = {
  name: string;
  count: number;
  change: string;
  severity: "High" | "Medium" | "Low";
  color: string;
  summary: string;
};

type ComparisonPeriod = {
  start_date: string;
  end_date: string;
  feedback_count: number;
  negative_count: number;
  negative_rate_pct: number;
};

type CategoryChange = {
  category: string;
  previous_mentions: number;
  recent_mentions: number;
  mention_delta: number;
  previous_negative: number;
  recent_negative: number;
  negative_delta: number;
  previous_negative_rate_pct: number | null;
  recent_negative_rate_pct: number | null;
  negative_rate_delta_pp: number | null;
};

type ChangeAnalysis = {
  comparison: {
    window_days: number;
    previous_period: ComparisonPeriod;
    recent_period: ComparisonPeriod;
    negative_count_delta: number;
    negative_rate_delta_pp: number;
    category_changes: CategoryChange[];
  };
  report: {
    headline: string;
    overall_direction: string;
    key_findings: {
      title: string;
      category: string;
      priority: string;
      explanation: string;
    }[];
    recommended_actions: {
      title: string;
      action: string;
      priority: string;
      rationale: string;
    }[];
    model: string;
    source?: string;
    generated_at: string;
  };
};

type NavItem = { label: string; icon: LucideIcon };

const initialFeedback: Feedback[] = [
  { id: "FB-1024", customer: "Customer #1024", text: "My order arrived three days late and tracking never updated.", category: "Delivery", sentiment: "Negative", date: "2026-10-11", source: "Web review" },
  { id: "FB-1023", customer: "Customer #1023", text: "The new checkout is much faster. Payment was seamless.", category: "Checkout", sentiment: "Positive", date: "2026-10-11", source: "In-app" },
  { id: "FB-1022", customer: "Customer #1022", text: "I was charged twice and support has not responded yet.", category: "Payments", sentiment: "Negative", date: "2026-10-10", source: "Support ticket" },
  { id: "FB-1021", customer: "Customer #1021", text: "Product quality is good, but the packaging could improve.", category: "Product", sentiment: "Neutral", date: "2026-10-10", source: "Survey" },
  { id: "FB-1020", customer: "Customer #1020", text: "Support solved my issue in less than ten minutes.", category: "Support", sentiment: "Positive", date: "2026-10-09", source: "Chat" },
  { id: "FB-1019", customer: "Customer #1019", text: "The app is easy to navigate, but search misses common products.", category: "Discovery", sentiment: "Neutral", date: "2026-10-09", source: "App review" },
  { id: "FB-1018", customer: "Customer #1018", text: "Refund came through quickly. Great experience overall.", category: "Payments", sentiment: "Positive", date: "2026-10-08", source: "Web review" },
  { id: "FB-1017", customer: "Customer #1017", text: "My package was marked delivered but never arrived.", category: "Delivery", sentiment: "Negative", date: "2026-10-08", source: "Support ticket" },
  { id: "FB-1016", customer: "Customer #1016", text: "Would love more size options for this product.", category: "Product", sentiment: "Neutral", date: "2026-10-07", source: "Survey" },
  { id: "FB-1015", customer: "Customer #1015", text: "Checkout and payment were both smooth this time.", category: "Checkout", sentiment: "Positive", date: "2026-10-07", source: "In-app" },
  { id: "FB-1014", customer: "Customer #1014", text: "The help centre articles did not answer my billing question.", category: "Support", sentiment: "Negative", date: "2026-10-06", source: "Chat" },
  { id: "FB-1013", customer: "Customer #1013", text: "Good value and fast delivery. I would order again.", category: "Delivery", sentiment: "Positive", date: "2026-10-05", source: "Web review" },
];

const trendData = [
  { day: "Mon", positive: 72, negative: 22 },
  { day: "Tue", positive: 68, negative: 28 },
  { day: "Wed", positive: 76, negative: 24 },
  { day: "Thu", positive: 70, negative: 32 },
  { day: "Fri", positive: 79, negative: 25 },
  { day: "Sat", positive: 74, negative: 35 },
  { day: "Sun", positive: 84, negative: 29 },
];

const issueData: Issue[] = [
  { name: "Delivery delays", count: 78, change: "+34%", severity: "High", color: "#ed6874", summary: "Late or missing orders and tracking gaps are recurring in the sample feedback." },
  { name: "Payment failures", count: 56, change: "+18%", severity: "High", color: "#e6a34d", summary: "Duplicate charges and payment interruptions may be creating avoidable friction." },
  { name: "Customer support", count: 42, change: "+8%", severity: "Medium", color: "#a78bfa", summary: "Customers mention response times and help articles that do not answer their questions." },
  { name: "Product quality", count: 29, change: "−12%", severity: "Low", color: "#29bd86", summary: "Product and packaging comments are present but trending down in the sample." },
];

const navItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Feedback Hub", icon: MessageSquareText },
  { label: "Signal Radar", icon: Radar },
  { label: "Decision Center", icon: Target },
  { label: "Issue Tracker", icon: ClipboardList },
  { label: "Adaption Model Lab", icon: FlaskConical },
  { label: "Reports", icon: FileChartColumn },
];

const pageDescriptions: Record<string, string> = {
  Overview: "Your customer experience, at a glance.",
  "Feedback Hub": "Explore and organize the voice of your customers.",
  "Signal Radar": "Spot emerging complaints before they escalate.",
  "Decision Center": "Turn customer signals into actionable priorities.",
  "Issue Tracker": "Follow important issues from discovery to resolution.",
  "Adaption Model Lab": "Explore and evaluate your AI analysis workflow.",
  Reports: "Turn customer insights into business-ready reports.",
};

const recommendations = [
  { id: "delivery", title: "Investigate delivery delays", description: "Review fulfilment performance and tracking updates to understand recurring late-order complaints.", impact: "Customer experience", priority: "High" },
  { id: "payments", title: "Audit payment reliability", description: "Investigate duplicate charges and payment interruptions across the checkout journey.", impact: "Trust & revenue", priority: "High" },
  { id: "support", title: "Improve support resolution", description: "Identify common hand-off delays and strengthen help articles for frequent billing questions.", impact: "Retention", priority: "Medium" },
];

function App() {
  const [analyses, setAnalyses] = useState<Record<string, FeedbackAnalysis>>({});
  const [expandedAnalyses, setExpandedAnalyses] = useState<string[]>([]);
  const [loadingAnalysisIds, setLoadingAnalysisIds] = useState<string[]>([]);

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      return localStorage.getItem("insightflow-theme") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });
  const [activeNav, setActiveNav] = useState("Overview");
  const [feedback, setFeedback] = useState<Feedback[]>(initialFeedback);
  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [csvFileName, setCsvFileName] = useState("");
  const [pendingCsvRows, setPendingCsvRows] = useState<CsvPreviewRow[]>([]);
  const [csvSkippedRows, setCsvSkippedRows] = useState<string[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedActions, setSavedActions] = useState<string[]>([]);
  const [issueStatuses, setIssueStatuses] = useState<Record<string, string>>({});
  const [analyzingIds, setAnalyzingIds] = useState<string[]>([]);
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<string[]>([]);
  const [bulkAnalysisProgress, setBulkAnalysisProgress] =
    useState<BulkAnalysisProgress>({
      running: false,
      total: 0,
      completed: 0,
      skipped: 0,
      failed: 0,
      currentId: "",
    });
  const [reviewedSignals, setReviewedSignals] = useState<string[]>([]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("insightflow-theme", theme);
    } catch {
      // Theme switching remains available when storage is blocked.
    }
  }, [theme]);

  // Load persistent records from the backend on startup.
  useEffect(() => {
    let cancelled = false;

    async function loadBackendData() {
      try {
        const responses = await Promise.all([
          fetch(`${API_BASE_URL}/api/feedback`),
          fetch(`${API_BASE_URL}/api/actions`),
          fetch(`${API_BASE_URL}/api/issues`),
        ]);

        if (responses.some((response) => !response.ok)) {
          throw new Error("Backend request failed");
        }

        const [serverFeedback, serverActions, serverIssues] =
          await Promise.all(responses.map((response) => response.json()));

        if (cancelled) return;

        setFeedback(serverFeedback);
        setSavedActions(
          serverActions.map((item: { action_id: string }) => item.action_id)
        );
        setIssueStatuses(
          Object.fromEntries(
            serverIssues.map(
              (item: { name: string; status: string }) =>
                [item.name, item.status]
            )
          )
        );
      } catch {
        if (!cancelled) {
          setToast(
            "Could not load saved data. Check that the backend is running."
          );
        }
      }
    }

    void loadBackendData();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFeedback = useMemo(() => feedback.filter((item) => {
    const haystack = `${item.text} ${item.category} ${item.customer} ${item.id} ${item.source}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesSentiment = sentimentFilter === "All" || item.sentiment === sentimentFilter;
    return matchesSearch && matchesSentiment;
  }), [feedback, search, sentimentFilter]);

  const sentimentCounts = useMemo(() => {
    const positive = feedback.filter((item) => item.sentiment === "Positive").length;
    const neutral = feedback.filter((item) => item.sentiment === "Neutral").length;
    const negative = feedback.filter((item) => item.sentiment === "Negative").length;
    const total = Math.max(feedback.length, 1);
    return {
      positive,
      neutral,
      negative,
      positivePct: Math.round((positive / total) * 100),
      neutralPct: Math.round((neutral / total) * 100),
      negativePct: Math.round((negative / total) * 100),
      data: [
        { name: "Positive", value: positive, color: "#29bd86" },
        { name: "Neutral", value: neutral, color: "#9aa79d" },
        { name: "Negative", value: negative, color: "#ed6874" },
      ],
    };
  }, [feedback]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function resetCsvPreview() {
    setCsvFileName("");
    setPendingCsvRows([]);
    setCsvSkippedRows([]);
  }

  function closeUploadModal() {
    setShowUpload(false);
    resetCsvPreview();
  }

  function handleUpload(file?: File) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      notify("Please choose a CSV file.");
      return;
    }

    setCsvFileName(file.name);
    setPendingCsvRows([]);
    setCsvSkippedRows([]);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) =>
        header.trim().toLowerCase().replace(/[\s-]+/g, "_"),

      complete: (results) => {
        const skippedRows: string[] = [];
        const previewRows: CsvPreviewRow[] = [];
        const placeholderValues = new Set([
          "string", "undefined", "null", "none", "n/a", "na", "nan",
        ]);

        const fields = results.meta.fields ?? [];
        const textColumns = [
          "text", "feedback", "comment", "review", "message",
          "feedback_text", "customer_feedback",
        ];
        const hasTextColumn = fields.some((field) =>
          textColumns.includes(field)
        );

        if (!hasTextColumn) {
          setCsvSkippedRows([
            "Header row: expected a text, feedback, comment, review, message, or feedback_text column.",
          ]);
          return;
        }

        const makeIsoDate = (
          year: number,
          month: number,
          day: number
        ): string | null => {
          const parsed = new Date(Date.UTC(year, month - 1, day));

          if (
            year < 1000 ||
            year > 9999 ||
            parsed.getUTCFullYear() !== year ||
            parsed.getUTCMonth() + 1 !== month ||
            parsed.getUTCDate() !== day
          ) {
            return null;
          }

          return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        };

        const normalizeCsvDate = (raw?: string): string | null => {
          const value = (raw ?? "").trim();

          if (!value) {
            const now = new Date();
            return makeIsoDate(
              now.getFullYear(),
              now.getMonth() + 1,
              now.getDate()
            );
          }

          const yearFirst = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(value);

          if (yearFirst) {
            return makeIsoDate(
              Number(yearFirst[1]),
              Number(yearFirst[2]),
              Number(yearFirst[3])
            );
          }

          const slashDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);

          if (slashDate) {
            const first = Number(slashDate[1]);
            const second = Number(slashDate[2]);
            const year = Number(slashDate[3]);

            if (first === second) return makeIsoDate(year, first, second);
            if (first > 12 && second <= 12) {
              return makeIsoDate(year, second, first);
            }
            if (second > 12 && first <= 12) {
              return makeIsoDate(year, first, second);
            }

            return null;
          }

          if (/[a-zA-Z]/.test(value)) {
            const parsed = new Date(value);
            if (!Number.isFinite(parsed.getTime())) return null;

            return makeIsoDate(
              parsed.getFullYear(),
              parsed.getMonth() + 1,
              parsed.getDate()
            );
          }

          return null;
        };

        const existingIds = new Set(feedback.map((item) => item.id));
        const seenIds = new Set<string>();
        const idSeed = Date.now();

        results.data.forEach((row, index) => {
          const rowNumber = index + 2;
          const rawText =
            row.text ??
            row.feedback ??
            row.comment ??
            row.review ??
            row.message ??
            row.feedback_text ??
            row.customer_feedback ??
            "";

          const text = rawText.trim();

          if (!text) {
            skippedRows.push(`Row ${rowNumber}: missing feedback text.`);
            return;
          }

          if (placeholderValues.has(text.toLowerCase())) {
            skippedRows.push(`Row ${rowNumber}: placeholder feedback text.`);
            return;
          }

          const normalizedDate = normalizeCsvDate(row.date);

          if (!normalizedDate) {
            skippedRows.push(
              `Row ${rowNumber}: invalid or ambiguous date "${row.date}". Use YYYY-MM-DD to avoid ambiguity.`
            );
            return;
          }

          const rawSentiment = (row.sentiment ?? "").trim().toLowerCase();
          let sentiment: Sentiment = "Neutral";

          if (["positive", "pos"].includes(rawSentiment)) {
            sentiment = "Positive";
          } else if (["negative", "neg"].includes(rawSentiment)) {
            sentiment = "Negative";
          } else if (
            rawSentiment &&
            !["neutral", "neu"].includes(rawSentiment)
          ) {
            skippedRows.push(
              `Row ${rowNumber}: unrecognized sentiment "${row.sentiment}". Use Positive, Neutral, or Negative.`
            );
            return;
          }

          const id = row.id?.trim() || `CSV-${idSeed}-${index}`;
          let duplicateReason: string | undefined;

          if (existingIds.has(id)) {
            duplicateReason = "This ID already exists; the backend will skip it.";
          } else if (seenIds.has(id)) {
            duplicateReason = "This ID is repeated in this CSV; the backend will skip it.";
          }

          seenIds.add(id);

          previewRows.push({
            rowNumber,
            duplicateReason,
            feedback: {
              id,
              customer:
                row.customer?.trim() ||
                row.customer_id?.trim() ||
                row.name?.trim() ||
                `Imported customer ${index + 1}`,
              text,
              category: row.category?.trim() || "Uncategorized",
              sentiment,
              date: normalizedDate,
              source: row.source?.trim() || "CSV import",
            },
          });
        });

        setPendingCsvRows(previewRows);
        setCsvSkippedRows(skippedRows);
      },

      error: () => {
        setPendingCsvRows([]);
        setCsvSkippedRows(["Could not read this CSV file."]);
      },
    });
  }

  async function confirmCsvImport() {
    if (csvImporting || pendingCsvRows.length === 0) return;

    setCsvImporting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingCsvRows.map((row) => row.feedback)),
      });

      if (!response.ok) {
        const failure = await response.json().catch(() => ({}));
        const detail = failure.detail;

        const reason =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((item: { msg?: string }) => item.msg ?? "Validation failed").join("; ")
              : "CSV import failed.";

        throw new Error(reason);
      }

      const importResult = await response.json() as {
        imported?: number;
        skipped_rows?: { row: number; reason: string }[];
      };

      const refreshed = await fetch(`${API_BASE_URL}/api/feedback`);

      if (!refreshed.ok) {
        throw new Error("Import finished, but feedback could not be reloaded. Refresh the page to see the latest records.");
      }

      setFeedback(await refreshed.json());

      const serverSkipped = importResult.skipped_rows ?? [];
      const skippedCount = csvSkippedRows.length + serverSkipped.length;

      const serverReasons = serverSkipped.slice(0, 2).map((item) => {
        const originalRow = pendingCsvRows[item.row - 1]?.rowNumber ?? item.row;
        return `Row ${originalRow}: ${item.reason}`;
      });

      const reasons = [
        ...csvSkippedRows.slice(0, 2),
        ...serverReasons,
      ].slice(0, 2);

      const importedCount = importResult.imported ?? 0;

      closeUploadModal();

      notify(
        `${importedCount} feedback ${importedCount === 1 ? "entry" : "entries"} saved to the database. ` +
        (skippedCount
          ? `${skippedCount} row(s) skipped. ${reasons.join(" ")} `
          : "") +
        "Sentiment labels were imported, not generated by AI."
      );
    } catch (caught) {
      notify(
        caught instanceof Error
          ? caught.message
          : "Could not save the CSV to the backend. Check the server and try again."
      );
    } finally {
      setCsvImporting(false);
    }
  }

  async function addFeedback() {
    const normalizedText = newText.trim();

    if (!normalizedText) {
      notify("Please enter a customer comment.");
      return;
    }

    if (["string", "undefined", "null", "none", "n/a", "na", "nan"].includes(normalizedText.toLowerCase())) {
      notify("Please enter actual customer feedback, not a placeholder value.");
      return;
    }

    const entry: Feedback = {
      id: `FB-${Date.now()}`,
      customer: "New customer",
      text: normalizedText,
      category: "Uncategorized",
      sentiment: "Neutral",
      date: new Date().toISOString().slice(0, 10),
      source: "Manual entry",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        const failure = await response.json().catch(() => ({}));
        throw new Error(
          typeof failure.detail === "string"
            ? failure.detail
            : "Could not save feedback."
        );
      }

      const saved: Feedback = await response.json();
      setFeedback((previous) => [
        saved,
        ...previous.filter((item) => item.id !== saved.id),
      ]);
      setNewText("");
      setShowAdd(false);
      await analyzeFeedback(saved.id);
    } catch (caught) {
      notify(
        caught instanceof Error
          ? caught.message
          : "Could not save feedback. Check that the backend is running."
      );
    }
  }

  function toggleFeedbackSelection(feedbackId: string) {
    setSelectedFeedbackIds((previous) =>
      previous.includes(feedbackId)
        ? previous.filter((id) => id !== feedbackId)
        : [...previous, feedbackId]
    );
  }

  function toggleAllVisibleFeedback(ids: string[]) {
    const allSelected =
      ids.length > 0 &&
      ids.every((id) => selectedFeedbackIds.includes(id));

    setSelectedFeedbackIds((previous) =>
      allSelected
        ? previous.filter((id) => !ids.includes(id))
        : [...new Set([...previous, ...ids])]
    );
  }

  async function analyzeSelectedFeedback(feedbackIds: string[]) {
    if (bulkAnalysisProgress.running) return;

    const selectedSet = new Set(feedbackIds);
    const selectedRecords = feedback.filter(
      (item) =>
        selectedSet.has(item.id) &&
        !analyzingIds.includes(item.id)
    );

    if (!selectedRecords.length) {
      notify("Select feedback records that are not already being analyzed.");
      return;
    }

    let completed = 0;
    let skipped = 0;
    let failed = 0;
    const failureReasons: string[] = [];

    setBulkAnalysisProgress({
      running: true,
      total: selectedRecords.length,
      completed: 0,
      skipped: 0,
      failed: 0,
      currentId: "",
    });

    for (const item of selectedRecords) {
      setBulkAnalysisProgress({
        running: true,
        total: selectedRecords.length,
        completed,
        skipped,
        failed,
        currentId: item.id,
      });

      try {
        // Reuse saved analysis when it already exists.
        const savedResponse = await fetch(
          `${API_BASE_URL}/api/feedback/${encodeURIComponent(item.id)}/analysis`
        );

        if (savedResponse.ok) {
          const saved = await savedResponse.json();

          setAnalyses((previous) => ({
            ...previous,
            [item.id]: {
              ...saved,
              sentiment: item.sentiment,
              category: item.category,
            } as FeedbackAnalysis,
          }));

          // Automatically reveal previously saved insights.
          setExpandedAnalyses((previous) =>
            previous.includes(item.id) ? previous : [...previous, item.id]
          );

          skipped += 1;
        } else if (savedResponse.status === 404) {
          // No saved analysis: use the existing, tested Gemini endpoint.
          const response = await fetch(
            `${API_BASE_URL}/api/feedback/${encodeURIComponent(item.id)}/analyze`,
            { method: "POST" }
          );

          const result = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              typeof result.detail === "string"
                ? result.detail
                : `Analysis request failed with HTTP ${response.status}.`
            );
          }

          setFeedback((previous) =>
            previous.map((record) =>
              record.id === result.feedback.id ? result.feedback : record
            )
          );

          setAnalyses((previous) => ({
            ...previous,
            [item.id]: result.analysis as FeedbackAnalysis,
          }));

          // Automatically reveal the newly generated insights.
          setExpandedAnalyses((previous) =>
            previous.includes(item.id) ? previous : [...previous, item.id]
          );

          completed += 1;
        } else {
          const details = await savedResponse.json().catch(() => ({}));
          throw new Error(
            typeof details.detail === "string"
              ? details.detail
              : `Could not check saved analysis (HTTP ${savedResponse.status}).`
          );
        }
      } catch (error) {
        failed += 1;

        if (failureReasons.length < 2) {
          failureReasons.push(
            `${item.id}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      setBulkAnalysisProgress({
        running: true,
        total: selectedRecords.length,
        completed,
        skipped,
        failed,
        currentId: item.id,
      });
    }

    setBulkAnalysisProgress({
      running: false,
      total: selectedRecords.length,
      completed,
      skipped,
      failed,
      currentId: "",
    });

    notify(
      `Bulk AI analysis finished: ${completed} newly analyzed, ` +
      `${skipped} already analyzed, ${failed} failed.` +
      (failureReasons.length
        ? ` Details: ${failureReasons.join(" | ")}`
        : "")
    );
  }

  async function analyzeFeedback(feedbackId: string) {
    if (analyzingIds.includes(feedbackId)) return;

    setAnalyzingIds((previous) => [...previous, feedbackId]);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/feedback/${encodeURIComponent(feedbackId)}/analyze`,
        { method: "POST" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "AI analysis failed.");
      }

      setFeedback((previous) =>
        previous.map((item) =>
          item.id === result.feedback.id ? result.feedback : item
        )
      );

      setAnalyses((previous) => ({
        ...previous,
        [feedbackId]: result.analysis as FeedbackAnalysis,
      }));
      setExpandedAnalyses((previous) =>
        previous.includes(feedbackId) ? previous : [...previous, feedbackId]
      );

      notify(
        `AI analysis complete: ${result.analysis.sentiment} · ` +
        `${result.analysis.category} · ${result.analysis.urgency} urgency.`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "AI analysis failed.";
      notify(`Feedback is saved, but ${message}`);
    } finally {
      setAnalyzingIds((previous) =>
        previous.filter((id) => id !== feedbackId)
      );
    }
  }

  async function toggleAnalysis(feedbackId: string) {
    if (expandedAnalyses.includes(feedbackId)) {
      setExpandedAnalyses((previous) =>
        previous.filter((id) => id !== feedbackId)
      );
      return;
    }

    setExpandedAnalyses((previous) =>
      previous.includes(feedbackId) ? previous : [...previous, feedbackId]
    );

    if (analyses[feedbackId]) return;

    setLoadingAnalysisIds((previous) =>
      previous.includes(feedbackId) ? previous : [...previous, feedbackId]
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/feedback/${encodeURIComponent(feedbackId)}/analysis`
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.detail || "No saved analysis was found. Analyze this feedback first."
        );
      }

      setAnalyses((previous) => ({
        ...previous,
        [feedbackId]: result as FeedbackAnalysis,
      }));
    } catch (error) {
      setExpandedAnalyses((previous) =>
        previous.filter((id) => id !== feedbackId)
      );
      notify(
        error instanceof Error
          ? `Could not load saved analysis: ${error.message}`
          : "Could not load saved analysis."
      );
    } finally {
      setLoadingAnalysisIds((previous) =>
        previous.filter((id) => id !== feedbackId)
      );
    }
  }

  function exportCsv() {
    const csv = Papa.unparse(feedback.map(({ id, customer, text, category, sentiment, date, source }) => ({
      id, customer, feedback: text, category, sentiment, date, source,
    })));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "insightflow-feedback-report.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    notify("Feedback report exported.");
  }

  async function cycleIssueStatus(issueName: string) {
    const legacyIssueNames: Record<string, string> = {
      Payments: "Payment failures",
      Delivery: "Delivery delays",
      Support: "Customer support",
      Product: "Product quality",
    };
    const current =
      issueStatuses[issueName] ??
      (legacyIssueNames[issueName]
        ? issueStatuses[legacyIssueNames[issueName]]
        : undefined) ??
      "Open";
    const next =
      current === "Open"
        ? "Investigating"
        : current === "Investigating"
          ? "Resolved"
          : "Open";

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/issues/${encodeURIComponent(issueName)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }
      );
      if (!response.ok) throw new Error("Could not update issue");

      setIssueStatuses((previous) => ({ ...previous, [issueName]: next }));
      notify(`${issueName}: status changed to ${next}.`);
    } catch {
      notify("Could not update this issue. Check that the backend is running.");
    }
  }

  const headerTitle = activeNav === "Overview" ? "See the signals. Make better decisions." : activeNav;

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-visible" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Activity size={22} strokeWidth={2.5} /></div>
          <div className="brand-copy"><span className="brand-name">insightflow<span className="brand-dot">.</span></span><span className="brand-caption">CUSTOMER INTELLIGENCE</span></div>
          <button className="icon-button mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switcher" onClick={() => notify("Workspace switching is not available in this preview.")}>
          <div className="workspace-avatar">N</div>
          <div className="workspace-copy"><strong>Nova Commerce</strong><span>Demo workspace</span></div>
          <ChevronDown size={15} className="muted-icon" />
        </button>

        <div className="nav-label">ANALYZE</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeNav === label ? "active" : ""}`} onClick={() => { setActiveNav(label); setSidebarOpen(false); }} aria-current={activeNav === label ? "page" : undefined}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {label === "Signal Radar" && <span className="nav-count">3</span>}
              {label === "Adaption Model Lab" && <span className="nav-new">LAB</span>}
            </button>
          ))}
        </nav>

        <div className="nav-label manage-label">MANAGE</div>
        <button className="nav-item" onClick={() => notify("Settings are planned for a later iteration.")}><Settings size={18} strokeWidth={1.8} /><span>Settings</span></button>
        <button className="nav-item" onClick={() => notify("Help documentation is planned for a later iteration.")}><CircleHelp size={18} strokeWidth={1.8} /><span>Help & support</span></button>

        <div className="sidebar-bottom">
          <div className="plan-card"><div className="plan-top"><Sparkles size={16} /><span>INSIGHTFLOW PREVIEW</span></div><p>From raw feedback to clear next steps. One workspace for the customer voice.</p><div className="plan-meter"><span /></div><span className="plan-foot">SAMPLE DATA · AI CONNECTION PENDING</span></div>
          <div className="profile-row"><div className="profile-avatar">A</div><div className="profile-copy"><strong>Workspace Admin</strong><span>Product analyst</span></div><button className="icon-button" aria-label="Profile information" onClick={() => notify("This is a local demo profile.")}><ChevronDown size={16} /></button></div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><span>Workspace</span><ChevronRight size={14} /><strong>{activeNav}</strong></div>
          <div className="topbar-actions"><div className="live-indicator"><span /> Preview environment</div><button className="icon-button theme-toggle" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify("You're all caught up.")}><Bell size={18} /><i /></button><div className="topbar-divider" /><button className="date-selector" onClick={() => notify("Date-range filtering will be connected to analyzed data.")}><CalendarDays size={16} /><span>Last 7 days</span><ChevronDown size={14} /></button></div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" /> CUSTOMER INTELLIGENCE / {activeNav.toUpperCase()}</div><h1>{activeNav === "Overview" ? <>See the <span className="heading-accent">signals.</span><br />Make better decisions.</> : headerTitle}</h1><p>{pageDescriptions[activeNav]}</p></div>
            <div className="heading-actions"><button className="button button-secondary" onClick={() => setShowUpload(true)}><Upload size={16} /> Import CSV</button><button className="button button-primary" onClick={() => setShowAdd(true)}><Plus size={17} /> Add feedback</button></div>
          </section>

          {activeNav === "Overview" && <OverviewPage feedback={filteredFeedback} allFeedback={feedback} sentimentCounts={sentimentCounts} search={search} setSearch={setSearch} sentimentFilter={sentimentFilter} setSentimentFilter={setSentimentFilter} setActiveNav={setActiveNav} notify={notify} />}

          {activeNav === "Feedback Hub" && <FeedbackHub feedback={filteredFeedback} search={search} setSearch={setSearch} sentimentFilter={sentimentFilter} setSentimentFilter={setSentimentFilter} onAnalyze={analyzeFeedback} analyzingIds={analyzingIds} analyses={analyses} expandedAnalyses={expandedAnalyses} loadingAnalysisIds={loadingAnalysisIds} onToggleAnalysis={toggleAnalysis} notify={notify}
          selectedFeedbackIds={selectedFeedbackIds}
          onToggleSelectFeedback={toggleFeedbackSelection}
          onToggleSelectAllVisible={toggleAllVisibleFeedback}
          onBulkAnalyze={analyzeSelectedFeedback}
          bulkAnalysisProgress={bulkAnalysisProgress}
        />}

          {activeNav === "Signal Radar" && <SignalRadar reviewedSignals={reviewedSignals} setReviewedSignals={setReviewedSignals} notify={notify} />}

          {activeNav === "Decision Center" && <DecisionCenter savedActions={savedActions} setSavedActions={setSavedActions} notify={notify} />}

          {activeNav === "Issue Tracker" && <IssueTracker feedback={feedback} issueStatuses={issueStatuses} onCycleStatus={cycleIssueStatus} />}

          {activeNav === "Adaption Model Lab" && <AdaptionLab notify={notify} />}

          {activeNav === "Reports" && <ReportsPage feedback={feedback} sentimentCounts={sentimentCounts} onExport={exportCsv} />}

          <footer className="page-footer"><span>© 2026 InsightFlow <i /> Built for better customer decisions.</span><span><span className="footer-status" /> Preview environment <span className="footer-separator">·</span> Sample data</span></footer>
        </div>
      </main>

      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      {showUpload && <Modal
        title="Import customer feedback"
        description={csvFileName
          ? "Review the CSV validation results before saving anything."
          : "Choose a CSV file to preview and validate before importing."}
        onClose={closeUploadModal}
      >
        {!csvFileName ? (
          <label className="upload-dropzone">
            <Upload size={27} />
            <strong>Choose a CSV file</strong>
            <span>Header row required · CSV only</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                handleUpload(file);
              }}
            />
          </label>
        ) : (
          <div className="csv-preview">
            <div className="csv-preview-file">
              <div className="csv-preview-file-info">
                <strong>{csvFileName}</strong>
                <span>Review the rows below before confirming the import.</span>
              </div>
              <label className="button button-secondary csv-change-button">
                <Upload size={15} />
                Choose another
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    handleUpload(file);
                  }}
                />
              </label>
            </div>

            <div className="csv-preview-stats">
              <div className="csv-preview-stat">
                <strong>{pendingCsvRows.length}</strong>
                <span>Rows ready to submit</span>
              </div>
              <div className="csv-preview-stat csv-preview-stat-warning">
                <strong>{pendingCsvRows.filter((item) => Boolean(item.duplicateReason)).length}</strong>
                <span>Potential duplicates</span>
              </div>
              <div className="csv-preview-stat">
                <strong>{csvSkippedRows.length}</strong>
                <span>Invalid rows excluded</span>
              </div>
            </div>

            {pendingCsvRows.length > 0 ? (
              <>
                <div className="csv-preview-table-wrap">
                  <table className="csv-preview-table">
                    <thead>
                      <tr>
                        <th>CSV row</th>
                        <th>Customer</th>
                        <th>Feedback</th>
                        <th>Sentiment</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingCsvRows.slice(0, 8).map((item) => (
                        <tr key={`${item.rowNumber}-${item.feedback.id}`}>
                          <td>{item.rowNumber}</td>
                          <td>{item.feedback.customer}</td>
                          <td title={item.feedback.text}>{item.feedback.text}</td>
                          <td>
                            <span className={`csv-preview-sentiment ${item.feedback.sentiment.toLowerCase()}`}>
                              {item.feedback.sentiment}
                            </span>
                          </td>
                          <td>
                            {item.duplicateReason ? (
                              <span className="csv-preview-status duplicate" title={item.duplicateReason}>
                                Duplicate
                              </span>
                            ) : (
                              <span className="csv-preview-status ready">Ready</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pendingCsvRows.length > 8 && (
                  <p className="csv-preview-more">
                    Showing the first 8 of {pendingCsvRows.length} valid rows.
                    All valid rows will be submitted after confirmation.
                  </p>
                )}
              </>
            ) : (
              <div className="csv-preview-empty">
                No valid rows are ready to import. Choose another file or correct the issues in your CSV.
              </div>
            )}

            {csvSkippedRows.length > 0 && (
              <details className="csv-preview-skipped">
                <summary>View invalid rows ({csvSkippedRows.length})</summary>
                <ul>
                  {csvSkippedRows.slice(0, 20).map((reason, index) => (
                    <li key={`${index}-${reason}`}>{reason}</li>
                  ))}
                </ul>
                {csvSkippedRows.length > 20 && (
                  <p>Showing 20 of {csvSkippedRows.length} invalid rows.</p>
                )}
              </details>
            )}

            <p className="modal-note">
              Potential duplicate IDs are highlighted for review and will be skipped by the backend.
              Imported sentiment labels are not generated by AI.
            </p>

            <div className="modal-actions csv-preview-actions">
              <button
                className="button button-secondary"
                onClick={closeUploadModal}
                disabled={csvImporting}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                onClick={confirmCsvImport}
                disabled={csvImporting || pendingCsvRows.length === 0}
              >
                {csvImporting ? "Importing..." : `Confirm import (${pendingCsvRows.length})`}
                {!csvImporting && <Check size={15} />}
              </button>
            </div>
          </div>
        )}
        <p className="modal-note">
          Supported columns include text, feedback, comment, review, message, id, customer, category, sentiment, date, and source.
        </p>
      </Modal>}

      {showAdd && <Modal title="Add customer feedback" description="Capture a customer comment in the current workspace." onClose={() => setShowAdd(false)}><label className="form-label">Customer comment<textarea autoFocus value={newText} onChange={(event) => setNewText(event.target.value)} placeholder="What did the customer say?" rows={4} /></label><div className="modal-actions"><button className="button button-secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="button button-primary" onClick={addFeedback} disabled={!newText.trim()}>Add feedback <Plus size={15} /></button></div></Modal>}

      {toast && <div className="toast-message" role="status"><CheckCircle2 size={17} /><span>{toast}</span><button onClick={() => setToast("")} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </div>
  );
}

function OverviewPage({
  feedback,
  allFeedback,
  sentimentCounts,
  search,
  setSearch,
  sentimentFilter,
  setSentimentFilter,
  setActiveNav,
  notify,
}: {
  feedback: Feedback[];
  allFeedback: Feedback[];
  sentimentCounts: {
    positive: number;
    neutral: number;
    negative: number;
    positivePct: number;
    neutralPct: number;
    negativePct: number;
    data: { name: string; value: number; color: string }[];
  };
  search: string;
  setSearch: (value: string) => void;
  sentimentFilter: string;
  setSentimentFilter: (value: string) => void;
  setActiveNav: (value: string) => void;
  notify: (message: string) => void;
}) {
  const [trendSource, setTrendSource] = useState<
    "loading" | "live" | "fallback"
  >("loading");

  const dayMs = 24 * 60 * 60 * 1000;

  const datedFeedback = allFeedback.filter((item) => {
    const day = item.date.slice(0, 10);
    return (
      /^\d{4}-\d{2}-\d{2}$/.test(day) &&
      Number.isFinite(Date.parse(`${day}T00:00:00Z`))
    );
  });

  const sortedDates = datedFeedback
    .map((item) => item.date.slice(0, 10))
    .sort();

  const earliestDate = sortedDates[0];
  const latestDate = sortedDates[sortedDates.length - 1];

  const availableDays =
    earliestDate && latestDate
      ? Math.floor(
          (Date.parse(`${latestDate}T00:00:00Z`) -
            Date.parse(`${earliestDate}T00:00:00Z`)) /
            dayMs
        ) + 1
      : 0;

  // Match the backend's comparison-window sizing.
  const periodDays =
    availableDays >= 2 ? Math.min(7, Math.floor(availableDays / 2)) : 1;

  const recentStart = latestDate
    ? new Date(
        Date.parse(`${latestDate}T00:00:00Z`) -
          (periodDays - 1) * dayMs
      ).toISOString().slice(0, 10)
    : "";

  const previousEnd = recentStart
    ? new Date(
        Date.parse(`${recentStart}T00:00:00Z`) - dayMs
      ).toISOString().slice(0, 10)
    : "";

  const previousStart = previousEnd
    ? new Date(
        Date.parse(`${previousEnd}T00:00:00Z`) -
          (periodDays - 1) * dayMs
      ).toISOString().slice(0, 10)
    : "";

  const recentRecords = datedFeedback.filter((item) => {
    const day = item.date.slice(0, 10);
    return Boolean(recentStart && latestDate && day >= recentStart && day <= latestDate);
  });

  const previousRecords = datedFeedback.filter((item) => {
    const day = item.date.slice(0, 10);
    return Boolean(previousStart && previousEnd && day >= previousStart && day <= previousEnd);
  });

  const categoryNames = Array.from(
    new Set(
      [...previousRecords, ...recentRecords].map(
        (item) => item.category.trim() || "Uncategorized"
      )
    )
  );

  const categoryPalette: Record<string, string> = {
    payments: "#e6a34d",
    delivery: "#ed6874",
    support: "#a78bfa",
    checkout: "#29bd86",
    product: "#60a5fa",
    discovery: "#38bdf8",
  };

  const overviewIssues = categoryNames
    .map((category) => {
      const before = previousRecords.filter(
        (item) => (item.category.trim() || "Uncategorized") === category
      );
      const after = recentRecords.filter(
        (item) => (item.category.trim() || "Uncategorized") === category
      );

      const previousNegative = before.filter(
        (item) => item.sentiment === "Negative"
      ).length;

      const recentNegative = after.filter(
        (item) => item.sentiment === "Negative"
      ).length;

      const negativeDelta =
        before.length > 0 ? recentNegative - previousNegative : null;

      const negativeRate =
        after.length > 0 ? (recentNegative / after.length) * 100 : null;

      const change =
        negativeDelta === null
          ? "No prior baseline"
          : negativeDelta > 0
            ? `+${negativeDelta} negative`
            : negativeDelta < 0
              ? `−${Math.abs(negativeDelta)} negative`
              : "No change";

      const summary =
        after.length === 0
          ? "No feedback in the recent comparison period."
          : `${recentNegative} of ${after.length} recent mentions are negative${
              negativeRate === null ? "" : ` (${negativeRate.toFixed(1)}%)`
            }. ${
              before.length > 0
                ? `${previousNegative} of ${before.length} mentions were negative in the previous period.`
                : "No populated previous-period baseline is available."
            }`;

      return {
        name: category,
        count: after.length,
        change,
        severity:
          recentNegative >= 2
            ? "High" as const
            : recentNegative === 1
              ? "Medium" as const
              : "Low" as const,
        color: categoryPalette[category.toLowerCase()] ?? "#64748b",
        summary,
        recentNegative,
        previousNegative,
        negativeDelta,
        negativeRate,
      };
    })
    .sort(
      (a, b) =>
        b.recentNegative - a.recentNegative ||
        (b.negativeDelta ?? 0) - (a.negativeDelta ?? 0) ||
        b.count - a.count
    );

  const topIssues = overviewIssues.slice(0, 4);
  const priorityIssue =
    overviewIssues.find((item) => item.recentNegative > 0) ??
    overviewIssues[0];

  const categoryCount = new Set(
    allFeedback.map((item) => item.category.trim() || "Uncategorized")
  ).size;

  const signalHeadline = !priorityIssue
    ? "Add customer feedback to begin spotting trends."
    : priorityIssue.negativeDelta !== null && priorityIssue.negativeDelta > 0
      ? `${priorityIssue.name} complaints increased in the recent period.`
      : `${priorityIssue.name} has the highest recent negative-feedback volume.`;

  return (
    <>
      <section className="insight-banner">
        <div className="insight-icon"><Sparkles size={20} /></div>
        <div className="insight-copy">
          <div className="insight-label">
            YOUR DAILY SIGNAL <span className="demo-pill">LIVE DATA</span>
          </div>
          <p>
            <strong>{signalHeadline}</strong>{" "}
            {priorityIssue
              ? `${priorityIssue.recentNegative} of ${priorityIssue.count} recent mentions are labelled negative. This is a signal for investigation, not proof of a root cause.`
              : "Once feedback records are available, this area will highlight the category needing attention."}
          </p>
        </div>
        <button
          className="insight-action"
          onClick={() => setActiveNav("Signal Radar")}
        >
          Explore signal <ArrowUpRight size={16} />
        </button>
      </section>

      <section className="metrics-grid" aria-label="Key metrics">
        <MetricCard
          title="Feedback records"
          value={allFeedback.length.toLocaleString()}
          change="Current dataset"
          positive
          subtitle="all sources"
          icon={<MessageSquareText size={18} />}
          color="green"
        />
        <MetricCard
          title="Positive sentiment"
          value={`${sentimentCounts.positivePct}%`}
          change={`${sentimentCounts.positive} records`}
          positive
          subtitle="based on current labels"
          icon={<TrendingUp size={18} />}
          color="green"
        />
        <MetricCard
          title="Negative feedback"
          value={`${sentimentCounts.negativePct}%`}
          change={`${sentimentCounts.negative} records`}
          positive={false}
          subtitle="review recommended"
          icon={<AlertTriangle size={18} />}
          color="red"
        />
        <MetricCard
          title="Issue themes"
          value={String(categoryCount).padStart(2, "0")}
          change="Live dataset"
          positive
          subtitle="distinct feedback categories"
          icon={<Target size={18} />}
          color="amber"
        />
      </section>

      <section className="charts-grid">
        <div className="panel trend-panel">
          <div className="panel-heading">
            <div>
              <h2>Sentiment over time</h2>
              <p>Daily sentiment counts from backend analytics when available</p>
            </div>
            <span className="chart-caption">
              {trendSource === "live"
                ? "LIVE DATA"
                : trendSource === "loading"
                  ? "CONNECTING"
                  : "SAMPLE FALLBACK"}
            </span>
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot positive-dot" /> Positive</span>
            <span><i className="legend-dot negative-dot" /> Negative</span>
          </div>
          <TrendChart onSourceChange={setTrendSource} />
          <div className="chart-footnote">
            <span className="footnote-dot" />
            {trendSource === "live"
              ? "Daily sentiment counts were loaded from the backend."
              : trendSource === "loading"
                ? "Checking backend analytics."
                : "Backend analytics unavailable; illustrative chart values are shown."}
          </div>
        </div>

        <div className="panel sentiment-panel">
          <div className="panel-heading">
            <div>
              <h2>Sentiment breakdown</h2>
              <p>Share of current feedback labels</p>
            </div>
            <CircleHelp size={17} className="muted-icon" />
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentCounts.data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="69%"
                  outerRadius="91%"
                  paddingAngle={4}
                  stroke="none"
                >
                  {sentimentCounts.data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{allFeedback.length}</strong><span>RECORDS</span>
            </div>
          </div>
          <div className="sentiment-legend">
            {sentimentCounts.data.map((item) => (
              <div className="sentiment-legend-row" key={item.name}>
                <span className="sentiment-name">
                  <i style={{ background: item.color }} />{item.name}
                </span>
                <strong>
                  {item.value}{" "}
                  <small>
                    ({allFeedback.length
                      ? Math.round(item.value / allFeedback.length * 100)
                      : 0}%)
                  </small>
                </strong>
              </div>
            ))}
          </div>
          <div className="sentiment-note">
            <Activity size={15} />
            <span>Based on current saved labels, including imported and manual labels</span>
          </div>
        </div>
      </section>

      <section className="lower-grid">
        <div className="panel issues-panel">
          <div className="panel-heading">
            <div>
              <h2>
                Issues gaining momentum{" "}
                <span className="heading-count">
                  {String(topIssues.length).padStart(2, "0")}
                </span>
              </h2>
              <p>Ranked by recent negative counts and change versus the previous window</p>
            </div>
            <button
              className="text-action"
              onClick={() => setActiveNav("Signal Radar")}
            >
              View radar <ArrowUpRight size={15} />
            </button>
          </div>

          {topIssues.length === 0 ? (
            <p className="empty-state">Add dated feedback to identify category trends.</p>
          ) : (
            <div className="issue-list">
              {topIssues.map((issue, index) => (
                <div className="issue-row" key={issue.name}>
                  <div className="issue-rank">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="issue-main">
                    <div className="issue-title">{issue.name}</div>
                    <div className="issue-bar">
                      <span
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              issue.count /
                                Math.max(1, ...topIssues.map((item) => item.count)) *
                                100
                            )
                          )}%`,
                          background: issue.color,
                        }}
                      />
                    </div>
                    <p className="topic-summary">{issue.summary}</p>
                  </div>
                  <div className="issue-count">
                    <strong>{issue.count}</strong><span>recent mentions</span>
                  </div>
                  <div className={`issue-change ${
                    issue.negativeDelta === null
                      ? "neutral"
                      : issue.negativeDelta < 0
                        ? "down"
                        : issue.negativeDelta > 0
                          ? "up"
                          : "neutral"
                  }`}>
                    {issue.negativeDelta === null
                      ? <Activity size={14} />
                      : issue.negativeDelta < 0
                        ? <ArrowDownRight size={14} />
                        : issue.negativeDelta > 0
                          ? <ArrowUpRight size={14} />
                          : <Activity size={14} />}
                    {issue.change}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="issue-foot">
            <span><span className="tiny-status" /> Calculated from feedback labels</span>
            <span>{periodDays}-day recent window</span>
          </div>
        </div>

        <div className="panel priority-panel">
          <div className="panel-heading">
            <div>
              <h2>Priority radar</h2>
              <p>Highest recent negative-feedback volume</p>
            </div>
            <Radar size={19} className="radar-heading-icon" />
          </div>

          {priorityIssue ? (
            <div className="priority-feature">
              <div className="priority-top">
                <span className="priority-badge"><span /> {priorityIssue.severity.toUpperCase()} PRIORITY</span>
                <span className="priority-score">
                  {priorityIssue.severity === "High" ? "P1" :
                    priorityIssue.severity === "Medium" ? "P2" : "P3"}
                </span>
              </div>
              <h3>{priorityIssue.name}</h3>
              <p>{priorityIssue.summary}</p>
              <div className="priority-evidence">
                <div>
                  <MessageSquareText size={15} />
                  <span>
                    <strong>{priorityIssue.recentNegative} negative</strong>
                    <small>Recent records</small>
                  </span>
                </div>
                <div>
                  <TrendingUp size={15} />
                  <span>
                    <strong>{priorityIssue.change}</strong>
                    <small>Versus previous period</small>
                  </span>
                </div>
              </div>
              <button
                className="button button-primary priority-button"
                onClick={() => setActiveNav("Decision Center")}
              >
                Review recommendations <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <p className="empty-state">
              Add dated feedback to calculate a priority category.
            </p>
          )}

          <div className="priority-footer">
            <Sparkles size={15} />
            <span>Calculated from labels; validate findings before taking action</span>
          </div>
        </div>
      </section>

      <section className="panel feedback-panel">
        <div className="panel-heading feedback-heading">
          <div>
            <h2>Recent customer feedback</h2>
            <p>Explore what customers are saying</p>
          </div>
          <button
            className="button button-secondary button-small"
            onClick={() => setActiveNav("Feedback Hub")}
          >
            Open feedback hub <ChevronRight size={15} />
          </button>
        </div>
        <FeedbackToolbar
          search={search}
          setSearch={setSearch}
          sentimentFilter={sentimentFilter}
          setSentimentFilter={setSentimentFilter}
        />
        <FeedbackTable feedback={feedback.slice(0, 6)} notify={notify} />
        <div className="table-footer">
          <span>
            Showing {Math.min(feedback.length, 6)} of {feedback.length} matching entries · Current dataset
          </span>
          <button onClick={() => setActiveNav("Feedback Hub")}>
            Open feedback hub <ArrowUpRight size={14} />
          </button>
        </div>
      </section>
    </>
  );
}

function FeedbackHub({
  feedback, search, setSearch, sentimentFilter, setSentimentFilter,
  onAnalyze, analyzingIds, analyses, expandedAnalyses,
  loadingAnalysisIds, onToggleAnalysis, notify,
  selectedFeedbackIds, onToggleSelectFeedback,
  onToggleSelectAllVisible, onBulkAnalyze, bulkAnalysisProgress,
}: {
  feedback: Feedback[];
  search: string;
  setSearch: (value: string) => void;
  sentimentFilter: string;
  setSentimentFilter: (value: string) => void;
  onAnalyze: (id: string) => void;
  analyzingIds: string[];
  analyses: Record<string, FeedbackAnalysis>;
  expandedAnalyses: string[];
  loadingAnalysisIds: string[];
  onToggleAnalysis: (id: string) => void;
  notify: (message: string) => void;
  selectedFeedbackIds: string[];
  onToggleSelectFeedback: (id: string) => void;
  onToggleSelectAllVisible: (ids: string[]) => void;
  onBulkAnalyze: (ids: string[]) => void;
  bulkAnalysisProgress: BulkAnalysisProgress;
}) {

  const [adaptionVerifiedIds, setAdaptionVerifiedIds] =
    useState<string[]>([]);
  const [adaptionApprovalLoadingIds, setAdaptionApprovalLoadingIds] =
    useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAdaptionReviews() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/adaption/reviews`
        );

        if (!response.ok) return;

        const result = await response.json();

        if (!cancelled) {
          setAdaptionVerifiedIds(
            Array.isArray(result.verified_ids) ? result.verified_ids : []
          );
        }
      } catch {
        // Approval controls remain available if the status request can be retried.
      }
    }

    loadAdaptionReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleAdaptionReview(feedbackId: string) {
    if (adaptionApprovalLoadingIds.includes(feedbackId)) return;

    const currentlyApproved = adaptionVerifiedIds.includes(feedbackId);

    setAdaptionApprovalLoadingIds((previous) =>
      previous.includes(feedbackId) ? previous : [...previous, feedbackId]
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/adaption/reviews/${encodeURIComponent(feedbackId)}/approve`,
        { method: currentlyApproved ? "DELETE" : "POST" }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "Could not update Adaption review approval."
        );
      }

      setAdaptionVerifiedIds((previous) =>
        currentlyApproved
          ? previous.filter((id) => id !== feedbackId)
          : previous.includes(feedbackId)
            ? previous
            : [...previous, feedbackId]
      );

      notify(
        currentlyApproved
          ? "Adaption review approval revoked."
          : "Analysis approved for the Adaption review dataset."
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not update Adaption review approval."
      );
    } finally {
      setAdaptionApprovalLoadingIds((previous) =>
        previous.filter((id) => id !== feedbackId)
      );
    }
  }

  return (
    <section className="workspace-page">
      <div className="panel workspace-card">
        <div className="panel-heading">
          <div>
            <h2>Feedback explorer</h2>
            <p>Investigate individual comments and uncover actionable insights.</p>
          </div>
          <span className="workspace-status status-open">{feedback.length} results</span>
        </div>

        <FeedbackToolbar
          search={search}
          setSearch={setSearch}
          sentimentFilter={sentimentFilter}
          setSentimentFilter={setSentimentFilter}
        />

        <div className="bulk-analysis-toolbar">
          <label className="bulk-select-all">
            <input
              type="checkbox"
              checked={
                feedback.length > 0 &&
                feedback.every((item) =>
                  selectedFeedbackIds.includes(item.id)
                )
              }
              disabled={bulkAnalysisProgress.running || feedback.length === 0}
              onChange={() =>
                onToggleSelectAllVisible(feedback.map((item) => item.id))
              }
            />
            <span>Select all visible</span>
          </label>

          <span className="bulk-selected-count">
            {selectedFeedbackIds.length} selected
          </span>

          <div className="bulk-analysis-toolbar-actions">
            {selectedFeedbackIds.length > 0 && (
              <button
                className="button button-secondary"
                disabled={bulkAnalysisProgress.running}
                onClick={() => {
                  // Clicking the checked rows again clears their selection.
                  selectedFeedbackIds.forEach(onToggleSelectFeedback);
                }}
              >
                Clear selection
              </button>
            )}

            <button
              className="button button-primary"
              disabled={
                bulkAnalysisProgress.running ||
                selectedFeedbackIds.length === 0
              }
              onClick={() => onBulkAnalyze(selectedFeedbackIds)}
            >
              <Sparkles size={15} />
              {bulkAnalysisProgress.running
                ? "Analyzing..."
                : `Analyze selected (${selectedFeedbackIds.length})`}
            </button>
          </div>
        </div>

        {bulkAnalysisProgress.total > 0 && (
          <div className="bulk-analysis-progress" role="status" aria-live="polite">
            <div className="bulk-progress-heading">
              <span>
                {bulkAnalysisProgress.running
                  ? `Analyzing ${bulkAnalysisProgress.currentId || "selected feedback"}`
                  : "Last batch results"}
              </span>
              <strong>
                {bulkAnalysisProgress.completed +
                  bulkAnalysisProgress.skipped +
                  bulkAnalysisProgress.failed}
                /{bulkAnalysisProgress.total}
              </strong>
            </div>

            <div
              className="bulk-progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={bulkAnalysisProgress.total}
              aria-valuenow={
                bulkAnalysisProgress.completed +
                bulkAnalysisProgress.skipped +
                bulkAnalysisProgress.failed
              }
            >
              <span
                style={{
                  width: `${
                    ((bulkAnalysisProgress.completed +
                      bulkAnalysisProgress.skipped +
                      bulkAnalysisProgress.failed) /
                      bulkAnalysisProgress.total) * 100
                  }%`,
                }}
              />
            </div>

            <span className="bulk-progress-summary">
              {bulkAnalysisProgress.completed} analyzed ·{" "}
              {bulkAnalysisProgress.skipped} already analyzed ·{" "}
              {bulkAnalysisProgress.failed} failed
            </span>
          </div>
        )}

        <div className="workspace-feedback-list">
          {feedback.map((item) => {
            const analysis = analyses[item.id];
            const expanded = expandedAnalyses.includes(item.id);
            const loading = loadingAnalysisIds.includes(item.id);
            const confidence = Math.max(0, Math.min(100, analysis?.confidence ?? 0));

            return (
              <article className="workspace-feedback-row" key={item.id}>
                <SentimentIcon sentiment={item.sentiment} />

                <div className="workspace-feedback-content">
                  <div className="workspace-feedback-meta">
                    <strong>{item.customer}</strong>
                    <span>{item.date}</span>
                  </div>

                  <p>{item.text}</p>

                  <div className="workspace-feedback-tags">
                    <span className="category-tag">{item.category}</span>
                    <span className={`sentiment-tag ${item.sentiment.toLowerCase()}`}>
                      <i />{item.sentiment}
                    </span>
                    <span className="source-tag">{item.source}</span>

                    <label className="bulk-select-item">
                      <input
                        type="checkbox"
                        checked={selectedFeedbackIds.includes(item.id)}
                        disabled={bulkAnalysisProgress.running}
                        onChange={() => onToggleSelectFeedback(item.id)}
                        aria-label={`Select feedback ${item.id}`}
                      />
                      <span>Select</span>
                    </label>

                    <button
                      className="workspace-action"
                      disabled={
                        analyzingIds.includes(item.id) ||
                        bulkAnalysisProgress.running
                      }
                      onClick={() => onAnalyze(item.id)}
                    >
                      <Sparkles size={13} />
                      {analyzingIds.includes(item.id) ? "Analyzing..." : "Analyze with AI"}
                    </button>

                    <button
                      className="workspace-action"
                      disabled={loading}
                      onClick={() => onToggleAnalysis(item.id)}
                      aria-expanded={expanded}
                    >
                      {loading ? <Activity size={13} /> : <ChevronDown
                        size={13}
                        className={expanded ? "analysis-chevron-open" : ""}
                      />}
                      {loading ? "Loading..." : expanded ? "Hide AI insights" : "View AI insights"}
                    </button>
                  </div>

                  {expanded && (
                    <div className="feedback-analysis-panel">
                      {loading && !analysis ? (
                        <div className="analysis-loading">
                          <Activity size={17} /> Loading saved analysis...
                        </div>
                      ) : !analysis ? (
                        <p>No analysis is loaded. Try analyzing this feedback again.</p>
                      ) : (
                        <>
                          <div className="analysis-panel-heading">
                            <div>
                              <span className="analysis-eyebrow">
                                <Sparkles size={13} /> AI-POWERED ANALYSIS
                              </span>
                              <h3>Customer insight</h3>
                            </div>
                            <div className="analysis-status-tags">
                              <span className={`analysis-sentiment ${(analysis.sentiment || item.sentiment).toLowerCase()}`}>
                                {analysis.sentiment || item.sentiment}
                              </span>
                              {analysis.urgency && (
                                <span className={`analysis-urgency urgency-${analysis.urgency.toLowerCase()}`}>
                                  {analysis.urgency} urgency
                                </span>
                              )}
                            </div>
                          </div>

                          <section className="analysis-rationale">
                            <span className="analysis-section-label">WHY THIS FEEDBACK MATTERS</span>
                            <p>{analysis.rationale || "No rationale was returned."}</p>
                          </section>

                          {(analysis.topics || []).length > 0 && (
                            <section className="analysis-section">
                              <span className="analysis-section-label">KEY TOPICS</span>
                              <div className="analysis-chip-list">
                                {analysis.topics!.map((topic, index) => (
                                  <span className="analysis-chip" key={`${topic}-${index}`}>
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </section>
                          )}

                          <div className="analysis-detail-grid">
                            <section className="analysis-detail-card">
                              <span className="analysis-section-label">ROOT CAUSE</span>
                              <p>{analysis.root_cause || "A confirmed cause could not be established."}</p>
                            </section>
                            <section className="analysis-detail-card">
                              <span className="analysis-section-label">CUSTOMER IMPACT</span>
                              <p>{analysis.customer_impact || "The full impact is not established by this comment."}</p>
                            </section>
                          </div>

                          {(analysis.evidence_quotes || []).length > 0 && (
                            <section className="analysis-section">
                              <span className="analysis-section-label">EVIDENCE FROM THE COMMENT</span>
                              <div className="analysis-evidence-list">
                                {analysis.evidence_quotes!.map((quote, index) => (
                                  <blockquote key={`${quote}-${index}`}>{quote}</blockquote>
                                ))}
                              </div>
                            </section>
                          )}

                          <section className="analysis-section">
                            <span className="analysis-section-label">RECOMMENDED NEXT ACTIONS</span>
                            {(analysis.recommended_actions || []).length ? (
                              <ol className="analysis-action-list">
                                {analysis.recommended_actions!.map((action, index) => (
                                  <li key={`${action}-${index}`}>
                                    <span className="analysis-action-number">
                                      {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <span>{action}</span>
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <p>No recommended actions were returned.</p>
                            )}
                          </section>

                          <section className="analysis-confidence">
                            <div className="analysis-confidence-heading">
                              <span>Model confidence</span>
                              <strong>
                                {analysis.confidence == null ? "Not provided" : `${confidence}%`}
                              </strong>
                            </div>
                            <div
                              className="analysis-confidence-track"
                              role="progressbar"
                              aria-label="Model confidence"
                              aria-valuenow={confidence}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <span style={{ width: `${confidence}%` }} />
                            </div>
                            <p>Confidence reflects the model's interpretation, not a guarantee of correctness.</p>
                          </section>

                          <div className="analysis-metadata">
                            {analysis.model && <span>Model: {analysis.model}</span>}
                            {analysis.analyzed_at && (
                              <span>Analyzed {new Date(analysis.analyzed_at).toLocaleString()}</span>
                            )}
                          </div>

                          <div className="adaption-review-control">
                            <div className="adaption-review-copy">
                              <strong>Adaption training dataset</strong>
                              <span>
                                {adaptionVerifiedIds.includes(item.id)
                                  ? "Approved example — review can be revoked."
                                  : "Review this analysis before approving it as a training example."}
                              </span>
                            </div>
                            <button
                              className="button button-secondary adaption-review-button"
                              disabled={adaptionApprovalLoadingIds.includes(item.id)}
                              onClick={() => toggleAdaptionReview(item.id)}
                            >
                              {adaptionApprovalLoadingIds.includes(item.id)
                                ? "Saving..."
                                : adaptionVerifiedIds.includes(item.id)
                                  ? "Revoke approval"
                                  : "Approve for Adaption"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {feedback.length === 0 && (
            <div className="empty-state">No matching feedback. Try another search or filter.</div>
          )}
        </div>
      </div>

      <div className="workspace-note">
        <Activity size={17} />
        <div>
          <strong>Feedback is ready for analysis</strong>
          <p>Analyze a comment to create tailored insights, or open a saved analysis from the backend.</p>
        </div>
      </div>
    </section>
  );
}
function SignalRadar({
  reviewedSignals,
  setReviewedSignals,
  notify,
}: {
  reviewedSignals: string[];
  setReviewedSignals: (update: (previous: string[]) => string[]) => void;
  notify: (message: string) => void;
}) {
  const [analysis, setAnalysis] = useState<ChangeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadComparison() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/analytics/changes/analyze`,
          { method: "POST", headers: { Accept: "application/json" } }
        );
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            typeof payload.detail === "string"
              ? payload.detail
              : `Comparison request failed (${response.status}).`
          );
        }

        if (!payload.comparison || !payload.report) {
          throw new Error("The backend returned an incomplete comparison report.");
        }

        if (!cancelled) setAnalysis(payload as ChangeAnalysis);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load the live comparison."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadComparison();
    return () => {
      cancelled = true;
    };
  }, [refreshVersion]);

  const comparison = analysis?.comparison;
  const report = analysis?.report;

  const categories = comparison
    ? [...comparison.category_changes].sort(
        (a, b) =>
          b.recent_negative - a.recent_negative ||
          b.negative_delta - a.negative_delta ||
          b.recent_mentions - a.recent_mentions
      )
    : [];

  const formatPct = (value: number | null | undefined) =>
    typeof value === "number"
      ? `${value.toFixed(1).replace(/\.0$/, "")}%`
      : "—";

  const formatPp = (value: number | null | undefined) => {
    if (typeof value !== "number") return "No baseline";
    const amount = Math.abs(value).toFixed(1).replace(/\.0$/, "");
    return `${value > 0 ? "+" : value < 0 ? "−" : ""}${amount} pp`;
  };

  const formatDate = (value: string) => {
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
  };

  const formatPeriod = (period: ComparisonPeriod) =>
    `${formatDate(period.start_date)} – ${formatDate(period.end_date)}`;

  // Derive the direction from calculated backend metrics, not the AI label.
  const delta = comparison?.negative_rate_delta_pp ?? 0;
  const direction =
    delta > 0 ? "worsening" : delta < 0 ? "improving" : "stable";
  const directionClass =
    direction === "worsening"
      ? "status-critical"
      : direction === "improving"
        ? "status-resolved"
        : "status-investigating";

  return (
    <section className="workspace-page">
      <div className="panel workspace-card radar-live-hero">
        <div className="radar-live-header">
          <div>
            <span className="workspace-status status-investigating">
              LIVE COMPARISON
            </span>
            <h2>Signal Radar</h2>
            <p>
              Compare recent feedback with the previous period and identify
              categories that deserve investigation.
            </p>
          </div>
          <button
            className="button button-secondary"
            disabled={loading}
            onClick={() => setRefreshVersion((value) => value + 1)}
          >
            <TrendingUp size={15} />
            {loading ? "Analysing…" : "Refresh analysis"}
          </button>
        </div>

        {loading && !analysis && (
          <div className="radar-live-message">
            <Sparkles size={17} />
            <div>
              <strong>Loading the comparison</strong>
              <p>Fetching calculated metrics and the AI report.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="radar-live-error" role="alert">
            <AlertTriangle size={17} />
            <div>
              <strong>
                {analysis
                  ? "Refresh failed; showing the last successful report."
                  : "Could not load the comparison."}
              </strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {analysis && comparison && report && (
          <>
            <div className="radar-live-report-heading">
              <div className="radar-live-label-row">
                <span className={`workspace-status ${directionClass}`}>
                  {direction.toUpperCase()}
                </span>
                <span className="radar-live-muted">
                  {comparison.window_days}-day comparison windows
                </span>
              </div>
              <h3>{report.headline}</h3>
              <p>
                Negative sentiment{" "}
                {delta > 0 ? "increased" : delta < 0 ? "decreased" : "was unchanged"}
                {" "}by {Math.abs(delta).toFixed(1)} percentage points. Negative
                comments changed from {comparison.previous_period.negative_count}
                {" "}to {comparison.recent_period.negative_count}.
              </p>
            </div>

            <div className="radar-live-period-grid">
              <article className="radar-live-metric">
                <span>Previous period</span>
                <strong>{formatPct(comparison.previous_period.negative_rate_pct)}</strong>
                <p>
                  {comparison.previous_period.negative_count} negative of{" "}
                  {comparison.previous_period.feedback_count} records
                </p>
                <small>{formatPeriod(comparison.previous_period)}</small>
              </article>

              <article className="radar-live-metric radar-live-metric-current">
                <span>Recent period</span>
                <strong>{formatPct(comparison.recent_period.negative_rate_pct)}</strong>
                <p>
                  {comparison.recent_period.negative_count} negative of{" "}
                  {comparison.recent_period.feedback_count} records
                </p>
                <small>{formatPeriod(comparison.recent_period)}</small>
              </article>

              <article className="radar-live-metric">
                <span>Negative-rate change</span>
                <strong className={
                  delta > 0
                    ? "radar-live-negative"
                    : delta < 0
                      ? "radar-live-positive"
                      : ""
                }>
                  {formatPp(delta)}
                </strong>
                <p>
                  {comparison.negative_count_delta > 0
                    ? `+${comparison.negative_count_delta} negative comments`
                    : comparison.negative_count_delta < 0
                      ? `${comparison.negative_count_delta} negative comments`
                      : "No change in negative comment count"}
                </p>
                <small>Calculated from the feedback dataset</small>
              </article>
            </div>
          </>
        )}
      </div>

      {analysis && comparison && report && (
        <>
          <div className="panel workspace-card radar-live-section">
            <div className="panel-heading">
              <div>
                <h2>Categories to investigate</h2>
                <p>
                  Ranked by calculated negative counts in the recent period.
                </p>
              </div>
              <Radar size={19} className="radar-heading-icon" />
            </div>

            <div className="radar-live-topic-grid">
              {categories.map((category) => {
                const reviewed = reviewedSignals.includes(category.category);
                const rate = Math.max(
                  0,
                  Math.min(100, category.recent_negative_rate_pct ?? 0)
                );
                const attention =
                  category.recent_negative >= 2
                    ? "High"
                    : category.recent_negative === 1
                      ? "Medium"
                      : "Low";

                return (
                  <article className="radar-live-topic" key={category.category}>
                    <div className="radar-live-topic-heading">
                      <div>
                        <h3>{category.category}</h3>
                        <p>
                          {category.recent_negative} negative of{" "}
                          {category.recent_mentions} recent mentions
                        </p>
                      </div>
                      <span className={`workspace-status ${
                        attention === "High"
                          ? "status-critical"
                          : attention === "Medium"
                            ? "status-investigating"
                            : "status-resolved"
                      }`}>
                        {attention} attention
                      </span>
                    </div>

                    <div
                      className="radar-live-bar"
                      role="progressbar"
                      aria-label={`${category.category} recent negative rate`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={rate}
                    >
                      <span style={{ width: `${rate}%` }} />
                    </div>

                    <div className="radar-live-topic-stats">
                      <span>
                        {formatPct(category.recent_negative_rate_pct)} negative
                        recently
                      </span>
                      <span>{formatPp(category.negative_rate_delta_pp)} vs. prior</span>
                    </div>

                    <div className="radar-live-topic-foot">
                      <span>
                        {category.previous_negative} prior →{" "}
                        {category.recent_negative} recent negative
                      </span>
                      <span>
                        {category.mention_delta > 0
                          ? `+${category.mention_delta} mentions`
                          : category.mention_delta < 0
                            ? `${category.mention_delta} mentions`
                            : "Mentions unchanged"}
                      </span>
                    </div>

                    <button
                      className="workspace-action"
                      onClick={() => {
                        setReviewedSignals((previous) =>
                          reviewed
                            ? previous.filter((item) => item !== category.category)
                            : [...previous, category.category]
                        );
                        notify(
                          reviewed
                            ? `${category.category} removed from review list.`
                            : `${category.category} marked for review.`
                        );
                      }}
                    >
                      {reviewed
                        ? <><Check size={13} /> Marked for review</>
                        : "Mark for review"}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="panel workspace-card radar-live-section">
            <div className="panel-heading">
              <div>
                <h2>AI findings</h2>
                <p>
                  AI-generated finding titles are shown beside the backend's
                  calculated counts so you can verify their context.
                </p>
              </div>
              <Sparkles size={19} className="radar-heading-icon" />
            </div>

            <div className="radar-live-findings">
              {report.key_findings.map((finding, index) => {
                const category = comparison.category_changes.find(
                  (item) =>
                    item.category.toLowerCase() === finding.category.toLowerCase()
                );

                const metric =
                  finding.category.toLowerCase() === "overall"
                    ? `${comparison.previous_period.negative_count}/${comparison.previous_period.feedback_count} negative previously → ${comparison.recent_period.negative_count}/${comparison.recent_period.feedback_count} recently`
                    : category
                      ? `${category.previous_negative}/${category.previous_mentions} negative previously → ${category.recent_negative}/${category.recent_mentions} recently`
                      : "No matching calculated category metrics available.";

                return (
                  <article
                    className="radar-live-finding"
                    key={`${finding.category}-${finding.title}-${index}`}
                  >
                    <div className="radar-live-finding-top">
                      <span className={`workspace-status ${
                        finding.priority.toLowerCase() === "high"
                          ? "status-critical"
                          : "status-investigating"
                      }`}>
                        {finding.priority} priority
                      </span>
                      <span className="radar-live-muted">{finding.category}</span>
                    </div>
                    <h3>{finding.title}</h3>
                    <p className="radar-live-evidence">{metric}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="panel workspace-card radar-live-section">
            <div className="panel-heading">
              <div>
                <h2>Recommended actions</h2>
                <p>Suggested next steps from the AI comparison report.</p>
              </div>
              <Target size={19} className="radar-heading-icon" />
            </div>
            <div className="radar-live-actions">
              {report.recommended_actions.map((action, index) => (
                <article
                  className="radar-live-action"
                  key={`${action.title}-${index}`}
                >
                  <span className={`workspace-status ${
                    action.priority.toLowerCase() === "high"
                      ? "status-critical"
                      : action.priority.toLowerCase() === "low"
                        ? "status-resolved"
                        : "status-investigating"
                  }`}>
                    {action.priority} priority
                  </span>
                  <h3>{action.title}</h3>
                  <p>{action.action}</p>
                </article>
              ))}
            </div>
            <div className="radar-live-caveat">
              <strong>Interpret with care</strong>
              <p>
                These results describe this dataset, not necessarily all customers.
                Small samples can cause large percentage swings, and AI-generated
                findings are hypotheses rather than proof of causation.
              </p>
              <div className="radar-live-label-row">
                <span
                  className={`workspace-status ${
                    (report.source ?? (report.model === "deterministic-fallback"
                      ? "deterministic_fallback"
                      : "ai")) === "deterministic_fallback"
                      ? "status-investigating"
                      : "status-resolved"
                  }`}
                >
                  {(report.source ?? (report.model === "deterministic-fallback"
                    ? "deterministic_fallback"
                    : "ai")) === "deterministic_fallback"
                    ? "RULE-BASED FALLBACK"
                    : "AI-GENERATED"}
                </span>
                <small>
                  Model: {report.model} · Generated:{" "}
                  {Number.isNaN(new Date(report.generated_at).getTime())
                    ? report.generated_at
                    : new Date(report.generated_at).toLocaleString()}
                </small>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="workspace-note">
        <Sparkles size={17} />
        <div>
          <strong>
            Signal analysis status:{" "}
            {analysis ? "connected" : loading ? "loading" : "unavailable"}
          </strong>
          <p>
            The sentiment timeline uses backend analytics. Category comparisons,
            findings, and recommendations load from the live comparison endpoint
            when available.
          </p>
        </div>
      </div>
    </section>
  );
}

function DecisionCenter({
  savedActions,
  setSavedActions,
  notify,
}: {
  savedActions: string[];
  setSavedActions: (update: (previous: string[]) => string[]) => void;
  notify: (message: string) => void;
}) {
  const [analysis, setAnalysis] = useState<ChangeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [savingIds, setSavingIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/analytics/changes/analyze`,
          {
            method: "POST",
            headers: { Accept: "application/json" },
          }
        );

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            typeof payload.detail === "string"
              ? payload.detail
              : `Could not load recommendations (${response.status}).`
          );
        }

        if (!payload.comparison || !payload.report) {
          throw new Error("The comparison response is incomplete.");
        }

        if (!cancelled) {
          setAnalysis(payload as ChangeAnalysis);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load live recommendations."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [refreshVersion]);

  const report = analysis?.report;
  const liveActions = report?.recommended_actions ?? [];
  const isFallback = report
    ? (report.source === "deterministic_fallback" ||
       report.model === "deterministic-fallback")
    : false;

  const sourceLabel = !report
    ? "DEMO BACKUP"
    : isFallback
      ? "RULE-BASED FALLBACK"
      : "AI-GENERATED";

  const liveCards = (() => {
    const occurrences: Record<string, number> = {};

    return liveActions.map((item, index) => {
      const words = `${item.title} ${item.action} ${item.rationale}`.toLowerCase();

      const categoryKey =
        /payment|charge|refund|billing/.test(words) ? "payments"
        : /deliver|tracking|shipment|late order/.test(words) ? "delivery"
        : /support|help centre|help center|response time/.test(words) ? "support"
        : /checkout|transaction|conversion/.test(words) ? "checkout"
        : /product|quality|size|packaging/.test(words) ? "product"
        : /search|discovery/.test(words) ? "discovery"
        : "general";

      occurrences[categoryKey] = (occurrences[categoryKey] ?? 0) + 1;

      const id = `live-${categoryKey}${
        occurrences[categoryKey] > 1
          ? `-${occurrences[categoryKey]}`
          : ""
      }`;

      const impact =
        categoryKey === "payments" ? "Trust & revenue"
        : categoryKey === "delivery" ? "Delivery experience"
        : categoryKey === "support" ? "Retention"
        : categoryKey === "checkout" ? "Conversion"
        : categoryKey === "product" ? "Product experience"
        : categoryKey === "discovery" ? "Product discovery"
        : "Customer experience";

      const priority =
        item.priority === "High" ||
        item.priority === "Medium" ||
        item.priority === "Low"
          ? item.priority
          : "Medium";

      return {
        id,
        title: item.title,
        description: item.action,
        rationale: item.rationale,
        priority,
        impact,
        iconKey: categoryKey,
        live: true as const,
        index,
      };
    });
  })();

  const demoCards = recommendations.map((item, index) => ({
    ...item,
    rationale: "",
    iconKey: item.id,
    live: false as const,
    index,
  }));

  const cards = liveCards.length > 0 ? liveCards : demoCards;
  const isLive = liveCards.length > 0;

  async function toggleSavedAction(item: (typeof cards)[number]) {
    if (savingIds.includes(item.id)) return;

    const currentlySaved = savedActions.includes(item.id);
    const nextSaved = !currentlySaved;

    setSavingIds((previous) => [...previous, item.id]);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/actions/${encodeURIComponent(item.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ saved: nextSaved }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not save action");
      }

      setSavedActions((previous) =>
        nextSaved
          ? (previous.includes(item.id) ? previous : [...previous, item.id])
          : previous.filter((entry) => entry !== item.id)
      );

      notify(
        nextSaved
          ? "Recommendation saved for review."
          : "Recommendation removed from saved actions."
      );
    } catch {
      notify("Could not update this action. Check that the backend is running.");
    } finally {
      setSavingIds((previous) => previous.filter((id) => id !== item.id));
    }
  }

  async function removeSavedAction(actionId: string) {
    if (savingIds.includes(actionId)) return;

    setSavingIds((previous) => [...previous, actionId]);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/actions/${encodeURIComponent(actionId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ saved: false }),
        }
      );

      if (!response.ok) throw new Error("Could not remove saved action.");

      setSavedActions((previous) =>
        previous.filter((entry) => entry !== actionId)
      );
      notify("Saved action removed.");
    } catch {
      notify("Could not remove this action. Check that the backend is running.");
    } finally {
      setSavingIds((previous) =>
        previous.filter((entry) => entry !== actionId)
      );
    }
  }

  return (
    <section className="workspace-page">
      <div className="panel workspace-card decision-live-heading">
        <div className="decision-live-heading-content">
          <span className={`workspace-status ${
            isLive
              ? isFallback
                ? "status-investigating"
                : "status-resolved"
              : "status-open"
          }`}>
            {sourceLabel}
          </span>
          <h2>Turn customer signals into action</h2>
          <p>
            Prioritised recommendations from the latest customer-feedback
            comparison, with the evidence and suggested next step kept together.
          </p>
        </div>
        <button
          className="button button-secondary"
          onClick={() => setRefreshVersion((value) => value + 1)}
          disabled={loading}
        >
          <TrendingUp size={15} />
          {loading ? "Analysing…" : "Refresh recommendations"}
        </button>
      </div>

      {loading && !analysis && (
        <div className="radar-live-message">
          <Sparkles size={17} />
          <div>
            <strong>Loading recommended actions</strong>
            <p>Fetching the comparison report from the backend.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="radar-live-error" role="alert">
          <AlertTriangle size={17} />
          <div>
            <strong>
              {analysis
                ? "Refresh failed; keeping the latest successful report."
                : "Live recommendations are unavailable."}
            </strong>
            <p>{error}</p>
            {!analysis && (
              <p>
                The cards below are demo examples, not live AI recommendations.
              </p>
            )}
          </div>
        </div>
      )}

      {isLive && (
        <div className="decision-live-context">
          <div>
            <span>Comparison status</span>
            <strong>
              {(analysis?.comparison.negative_rate_delta_pp ?? 0) > 0
                ? "Negative sentiment increased"
                : (analysis?.comparison.negative_rate_delta_pp ?? 0) < 0
                  ? "Negative sentiment decreased"
                  : "Negative sentiment unchanged"}
            </strong>
          </div>
          <div>
            <span>Negative sentiment</span>
            <strong>
              {analysis?.comparison.previous_period.negative_rate_pct}% →{" "}
              {analysis?.comparison.recent_period.negative_rate_pct}%
            </strong>
          </div>
          <div>
            <span>Recommended actions</span>
            <strong>{liveCards.length}</strong>
          </div>
        </div>
      )}

      {isLive && isFallback && (
        <p className="decision-live-note">
          These actions were created by deterministic fallback rules because
          the AI report was unavailable or invalid.
        </p>
      )}

      <div className="workspace-grid three-columns decision-live-grid">
        {cards.map((item) => {
          const saved = savedActions.includes(item.id);
          const saving = savingIds.includes(item.id);

          return (
            <article
              className="panel workspace-card decision-card"
              key={item.id}
            >
              <div className="decision-card-top">
                <span className={`workspace-status ${
                  item.priority === "High"
                    ? "status-critical"
                    : item.priority === "Low"
                      ? "status-resolved"
                      : "status-investigating"
                }`}>
                  {item.priority} priority
                </span>
                <span className="decision-impact">{item.impact}</span>
              </div>

              <div className="decision-card-icon">
                {item.iconKey === "delivery" ? <Activity size={20} />
                  : item.iconKey === "payments" ? <ShieldAlert size={20} />
                  : item.iconKey === "checkout" ? <Target size={20} />
                  : <MessageSquareText size={20} />}
              </div>

              <h3>{item.title}</h3>
              <p>{item.description}</p>

              {"rationale" in item && item.rationale && (
                <div className="decision-live-rationale">
                  <strong>Why this matters</strong>
                  <p>{item.rationale}</p>
                </div>
              )}

              <button
                className={`button ${
                  saved ? "button-secondary" : "button-primary"
                } decision-save`}
                disabled={saving}
                onClick={() => void toggleSavedAction(item)}
              >
                {saving
                  ? <><Activity size={15} /> Saving…</>
                  : saved
                    ? <><CheckCircle2 size={15} /> Saved for review</>
                    : <><Plus size={15} /> Save action</>}
              </button>
            </article>
          );
        })}
      </div>

      <div className="panel workspace-card saved-summary decision-saved-panel">
        <div className="decision-saved-header">
          <div>
            <h2>Saved actions</h2>
            <p>
              All saved actions remain available here, including items from
              earlier recommendation versions.
            </p>
          </div>
          <strong>{savedActions.length.toString().padStart(2, "0")}</strong>
        </div>

        {savedActions.length === 0 ? (
          <p className="decision-saved-empty">No actions saved yet.</p>
        ) : (
          <div className="decision-saved-list">
            {savedActions.map((actionId) => {
              const current = cards.find((item) => item.id === actionId);
              const original = recommendations.find(
                (item) => item.id === actionId
              );
              const legacyLabels: Record<string, string> = {
                "live-payments-2": "Earlier payment recommendation",
                "live-product": "Earlier product recommendation",
                "live-payments": "Earlier payment recommendation",
                "live-delivery": "Earlier delivery recommendation",
                "delivery": "Earlier delivery recommendation",
              };
              const title =
                current?.title ??
                original?.title ??
                legacyLabels[actionId] ??
                actionId.replace(/-/g, " ");
              const removing = savingIds.includes(actionId);

              return (
                <div className="decision-saved-item" key={actionId}>
                  <div>
                    <strong>{title}</strong>
                    <span>
                      {current
                        ? "Current recommendation"
                        : "Saved from an earlier recommendation"}
                    </span>
                  </div>
                  <button
                    className="workspace-action"
                    disabled={removing}
                    onClick={() => void removeSavedAction(actionId)}
                  >
                    {removing ? "Removing…" : "Remove"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function IssueTracker({
  feedback,
  issueStatuses,
  onCycleStatus,
}: {
  feedback: Feedback[];
  issueStatuses: Record<string, string>;
  onCycleStatus: (issueName: string) => void;
}) {
  const datedFeedback = feedback.filter((item) => {
    const day = item.date.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(day) &&
      Number.isFinite(Date.parse(`${day}T00:00:00Z`));
  });

  const dates = datedFeedback.map((item) => item.date.slice(0, 10)).sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const dayMs = 24 * 60 * 60 * 1000;

  const availableDays = firstDate && lastDate
    ? Math.floor(
        (Date.parse(`${lastDate}T00:00:00Z`) -
          Date.parse(`${firstDate}T00:00:00Z`)) / dayMs
      ) + 1
    : 0;

  const periodDays = availableDays >= 2
    ? Math.min(7, Math.floor(availableDays / 2))
    : 1;

  const recentStart = lastDate
    ? new Date(
        Date.parse(`${lastDate}T00:00:00Z`) -
          (periodDays - 1) * dayMs
      ).toISOString().slice(0, 10)
    : "";

  const previousEnd = recentStart
    ? new Date(
        Date.parse(`${recentStart}T00:00:00Z`) - dayMs
      ).toISOString().slice(0, 10)
    : "";

  const previousStart = previousEnd
    ? new Date(
        Date.parse(`${previousEnd}T00:00:00Z`) -
          (periodDays - 1) * dayMs
      ).toISOString().slice(0, 10)
    : "";

  const categoryNames = Array.from(new Set(
    datedFeedback.map((item) => item.category.trim() || "Uncategorized")
  )).sort((a, b) => a.localeCompare(b));

  const palette: Record<string, string> = {
    payments: "#e6a34d",
    delivery: "#ed6874",
    support: "#a78bfa",
    checkout: "#29bd86",
    product: "#60a5fa",
    discovery: "#38bdf8",
  };

  const liveIssues: Issue[] = categoryNames.map((category) => {
    const records = datedFeedback.filter(
      (item) => (item.category.trim() || "Uncategorized") === category
    );

    const inWindow = (item: Feedback, from: string, to: string) => {
      const day = item.date.slice(0, 10);
      return Boolean(from && to && day >= from && day <= to);
    };

    const before = records.filter(
      (item) => inWindow(item, previousStart, previousEnd)
    );
    const after = records.filter(
      (item) => inWindow(item, recentStart, lastDate ?? "")
    );

    const previousNegative = before.filter(
      (item) => item.sentiment === "Negative"
    ).length;
    const recentNegative = after.filter(
      (item) => item.sentiment === "Negative"
    ).length;

    const delta = recentNegative - previousNegative;
    const rate = after.length ? recentNegative / after.length * 100 : null;

    const change = before.length === 0
      ? "No prior baseline"
      : delta > 0
        ? `+${delta} negative`
        : delta < 0
          ? `−${Math.abs(delta)} negative`
          : "No change";

    const summary = after.length === 0
      ? "No feedback in the recent comparison window."
      : `${recentNegative} of ${after.length} recent mentions are negative` +
        `${rate === null ? "" : ` (${rate.toFixed(1)}%)`}. ` +
        (before.length
          ? `${previousNegative} of ${before.length} mentions were negative in the previous window.`
          : "No populated previous-period baseline is available.");

    return {
      name: category,
      count: after.length,
      change,
      severity: recentNegative >= 2
        ? "High"
        : recentNegative === 1
          ? "Medium"
          : "Low",
      color: palette[category.toLowerCase()] ?? "#64748b",
      summary,
    };
  });

  const hasLiveFeedback = datedFeedback.length > 0;
  const issues = hasLiveFeedback ? liveIssues : issueData;
  const maxMentions = Math.max(1, ...issues.map((item) => item.count));

  const legacyIssueNames: Record<string, string> = {
    Payments: "Payment failures",
    Delivery: "Delivery delays",
    Support: "Customer support",
    Product: "Product quality",
  };

  const getStatus = (name: string) =>
    issueStatuses[name] ??
    (legacyIssueNames[name]
      ? issueStatuses[legacyIssueNames[name]]
      : undefined) ??
    "Open";

  const openCount = issues.filter(
    (issue) => getStatus(issue.name) === "Open"
  ).length;
  const investigatingCount = issues.filter(
    (issue) => getStatus(issue.name) === "Investigating"
  ).length;
  const resolvedCount = issues.filter(
    (issue) => getStatus(issue.name) === "Resolved"
  ).length;

  const sortedIssues = [...issues].sort((a, b) => {
    const aStatus = getStatus(a.name);
    const bStatus = getStatus(b.name);
    const aResolved = aStatus === "Resolved" ? 1 : 0;
    const bResolved = bStatus === "Resolved" ? 1 : 0;
    return aResolved - bResolved || b.count - a.count || a.name.localeCompare(b.name);
  });

  return (
    <section className="workspace-page">
      <div className="workspace-note issue-live-context">
        <Activity size={18} />
        <div>
          <strong>{hasLiveFeedback ? "Live feedback categories" : "Demo categories"}</strong>
          <p>
            {hasLiveFeedback
              ? `Category counts and negative feedback are calculated from your records. The recent window ends ${lastDate} and spans ${periodDays} day(s).`
              : "No dated feedback is available, so example issue groups are shown."}
            {" "}Status changes are saved through the backend.
          </p>
        </div>
      </div>

      <div className="workspace-metric-grid">
        <WorkspaceStat
          title="Tracked categories"
          value={String(issues.length)}
          note={hasLiveFeedback ? "Distinct feedback categories" : "Example issue groups"}
        />
        <WorkspaceStat
          title="Open issues"
          value={String(openCount)}
          note="Awaiting investigation"
        />
        <WorkspaceStat
          title="Resolved"
          value={String(resolvedCount)}
          note={`${investigatingCount} currently investigating`}
        />
      </div>

      <div className="panel workspace-card">
        <div className="panel-heading">
          <div>
            <h2>Issue register</h2>
            <p>
              Prioritise categories by recent negative feedback and track their
              status through the investigation workflow.
            </p>
          </div>
          <ClipboardList size={20} className="radar-heading-icon" />
        </div>

        {sortedIssues.length === 0 ? (
          <p className="empty-state">
            Add feedback with valid dates to create tracked categories.
          </p>
        ) : (
          <div className="issue-register">
            {sortedIssues.map((issue) => {
              const status = getStatus(issue.name);

              return (
                <div className="issue-register-row" key={issue.name}>
                  <div
                    className="issue-register-mark"
                    style={{ background: issue.color }}
                  />
                  <div className="issue-register-main">
                    <strong>{issue.name}</strong>
                    <span>
                      {issue.count} recent mentions · {issue.change}
                    </span>
                    <div className="issue-bar">
                      <span
                        style={{
                          width: `${issue.count / maxMentions * 100}%`,
                          background: issue.color,
                        }}
                      />
                    </div>
                    <p>{issue.summary}</p>
                  </div>

                  <span className={`workspace-status ${
                    status === "Resolved"
                      ? "status-resolved"
                      : status === "Investigating"
                        ? "status-investigating"
                        : "status-open"
                  }`}>
                    {status}
                  </span>

                  <button
                    className="button button-secondary issue-status-button"
                    onClick={() => onCycleStatus(issue.name)}
                  >
                    {status === "Open"
                      ? "Investigate"
                      : status === "Investigating"
                        ? "Resolve"
                        : "Reopen"}
                    <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="workspace-small-note">
          Counts use the recent dated feedback window. Category statuses are
          persisted by the backend.
        </p>
      </div>
    </section>
  );
}

function AdaptionLab({ notify }: { notify: (message: string) => void }) {
  const [connection, setConnection] =
    useState<AdaptionConnectionStatus | null>(null);
  const [readiness, setReadiness] =
    useState<AdaptionReviewReadiness | null>(null);
  const [verifiedIds, setVerifiedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [datasetExporting, setDatasetExporting] = useState(false);
  const [datasetUploading, setDatasetUploading] = useState(false);
  const [uploadEstimate, setUploadEstimate] =
    useState<AdaptionUploadEstimate | null>(null);
  const [optimizationStarting, setOptimizationStarting] = useState(false);
  const [optimizationChecking, setOptimizationChecking] = useState(false);
  const [optimizationStatus, setOptimizationStatus] =
    useState<AdaptionOptimizationStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAdaptionStatus() {
      setLoading(true);
      setError("");

      try {
        const [connectionResponse, readinessResponse, reviewsResponse] =
          await Promise.all([
            fetch(`${API_BASE_URL}/api/adaption/status`),
            fetch(`${API_BASE_URL}/api/adaption/reviews/status`),
            fetch(`${API_BASE_URL}/api/adaption/reviews`),
          ]);

        const responses = [
          connectionResponse,
          readinessResponse,
          reviewsResponse,
        ];

        const payloads = await Promise.all(
          responses.map((response) =>
            response.json().catch(() => ({}))
          )
        );

        const failedIndex = responses.findIndex(
          (response) => !response.ok
        );

        if (failedIndex !== -1) {
          const failedPayload = payloads[failedIndex] as {
            detail?: string;
          };

          throw new Error(
            failedPayload.detail ||
              `Could not load Adaption status (HTTP ${responses[failedIndex].status}).`
          );
        }

        if (cancelled) return;

        setConnection(payloads[0] as AdaptionConnectionStatus);
        setReadiness(payloads[1] as AdaptionReviewReadiness);

        const reviewPayload = payloads[2] as {
          verified_ids?: string[];
        };

        setVerifiedIds(
          Array.isArray(reviewPayload.verified_ids)
            ? reviewPayload.verified_ids
            : []
        );
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load Adaption readiness."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAdaptionStatus();

    return () => {
      cancelled = true;
    };
  }, [refreshVersion]);


  async function downloadReviewedDataset() {
    if (datasetExporting) return;

    setDatasetExporting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/adaption/reviews/dataset`
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "Could not prepare the reviewed dataset."
        );
      }

      const rows = Array.isArray(result.rows) ? result.rows : [];

      if (rows.length === 0) {
        notify(
          "No current human-approved examples are available. " +
          "Review and approve analyses in Feedback Hub first."
        );
        return;
      }

      const csv = Papa.unparse(rows, {
        columns: ["prompt", "completion"],
      });

      const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "insightflow-adaption-reviewed-dataset.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      notify(
        `Downloaded ${rows.length} verified examples as a local CSV. ` +
        "Nothing was uploaded to Adaption."
      );
    } catch (caught) {
      notify(
        caught instanceof Error
          ? caught.message
          : "Could not export the reviewed dataset."
      );
    } finally {
      setDatasetExporting(false);
    }
  }


  async function uploadReviewedDatasetForEstimate() {
    if (datasetUploading) return;

    const confirmed = window.confirm(
      "External data transfer confirmation\n\n" +
      "This will send currently human-approved customer feedback and its " +
      "reviewed AI analysis to Adaption, an external service, and request " +
      "a cost estimate. It will not start an adaptation run or model training.\n\n" +
      "Continue with the upload?"
    );

    if (!confirmed) return;

    setDatasetUploading(true);
    setUploadEstimate(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/adaption/reviews/upload-estimate`,
        { method: "POST" }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : `Adaption upload failed (HTTP ${response.status}).`
        );
      }

      const estimateResult = result as AdaptionUploadEstimate;
      setUploadEstimate(estimateResult);

      setOptimizationStatus(
        estimateResult.optimization_status
          ? {
              dataset_id: estimateResult.dataset_id,
              run_id: estimateResult.optimization_run_id,
              status: estimateResult.optimization_status,
              optimization_started: Boolean(estimateResult.optimization_started),
              message: estimateResult.message,
            }
          : null
      );

      notify(
        result.estimate_available
          ? `Adaption dataset ready: ${result.record_count} approved examples. ` +
            `Estimated credits: ${result.estimated_credits_consumed ?? "not returned"}.`
          : result.message || "Dataset uploaded, but an estimate is unavailable."
      );
    } catch (caught) {
      notify(
        caught instanceof Error
          ? caught.message
          : "Could not upload the reviewed dataset to Adaption."
      );
    } finally {
      setDatasetUploading(false);
    }
  }

  async function startAdaptionOptimization() {
    const datasetId = uploadEstimate?.dataset_id;

    if (!datasetId || !uploadEstimate?.estimate_available) {
      notify("Upload the approved dataset and obtain a valid estimate first.");
      return;
    }

    if (optimizationStarting) return;

    const credits = uploadEstimate.estimated_credits_consumed;
    const minutes = uploadEstimate.estimated_minutes;
    const confirmed = window.confirm(
      "START ADAPTION DATASET OPTIMIZATION\n\n" +
      `Dataset: ${datasetId}\n` +
      `Approved rows: ${uploadEstimate.record_count ?? 0}\n` +
      `Estimated credits: ${credits ?? "not returned"}\n` +
      `Estimated minutes: ${minutes ?? "not returned"}\n\n` +
      "This sends the approved dataset for Adaptive Data processing and may " +
      "consume credits. It does NOT train a model. Once accepted, the remote " +
      "processing job may not be cancellable from InsightFlow.\n\n" +
      "Do you want to start?"
    );

    if (!confirmed) return;

    setOptimizationStarting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/adaption/reviews/optimization/start?dataset_id=${encodeURIComponent(datasetId)}`,
        { method: "POST" }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        notify(
          typeof result.detail === "string"
            ? result.detail
            : `Optimization launch failed (HTTP ${response.status}).`
        );
        return;
      }

      setOptimizationStatus(result as AdaptionOptimizationStatus);
      notify(
        result.message ||
        `Adaption optimization status: ${result.status || "submitted"}.`
      );
    } catch (caught) {
      const message = caught instanceof Error
        ? caught.message
        : "The launch response could not be confirmed.";

      // A browser/network failure may happen after the server accepted the run.
      // This state permits only an idempotent retry using the same dataset key.
      setOptimizationStatus({
        dataset_id: datasetId,
        status: "launch_uncertain",
        optimization_started: false,
        message:
          "The response was interrupted and the launch is uncertain. " +
          "Use the safe retry action; InsightFlow reuses the same idempotency key. " +
          message,
      });

      notify(
        "Could not confirm the launch. The state is marked uncertain; retry safely " +
        "from this same action rather than creating a new dataset."
      );
    } finally {
      setOptimizationStarting(false);
    }
  }

  async function refreshAdaptionOptimizationStatus() {
    const datasetId = uploadEstimate?.dataset_id;

    if (!datasetId || optimizationChecking) return;

    setOptimizationChecking(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/adaption/reviews/optimization/status?dataset_id=${encodeURIComponent(datasetId)}`
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        notify(
          typeof result.detail === "string"
            ? result.detail
            : `Could not refresh optimization status (HTTP ${response.status}).`
        );
        return;
      }

      setOptimizationStatus(result as AdaptionOptimizationStatus);
      notify(
        result.message ||
        `Adaption optimization status: ${result.status || "unknown"}.`
      );
    } catch (caught) {
      notify(
        caught instanceof Error
          ? caught.message
          : "Could not refresh Adaption optimization status."
      );
    } finally {
      setOptimizationChecking(false);
    }
  }

  const verifiedCount = readiness?.verified_examples ?? verifiedIds.length;
  const referenceTarget = readiness?.minimum_reference_rows_for_sft ?? 1000;
  const percentage = referenceTarget > 0
    ? Math.min(100, Math.round((verifiedCount / referenceTarget) * 100))
    : 0;

  const optimizationNeedsSafeRetry =
    optimizationStatus?.status === "launch_uncertain";
  const optimizationAlreadyStarted =
    Boolean(optimizationStatus?.optimization_started) &&
    !optimizationNeedsSafeRetry;
  const optimizationCanRefresh =
    Boolean(optimizationStatus?.optimization_started) ||
    ["launching", "launch_uncertain"].includes(
      optimizationStatus?.status ?? ""
    );

  const connectionLabel = loading
    ? "CHECKING CONNECTION"
    : connection?.connected
      ? "ADAPTION API CONNECTED"
      : "CONNECTION NEEDS ATTENTION";

  return (
    <section className="workspace-page">
      <div className="lab-hero panel adaption-live-hero">
        <div className="lab-hero-content">
          <span
            className={`workspace-status ${
              connection?.connected ? "status-open" : "status-investigating"
            }`}
          >
            {connectionLabel}
          </span>
          <h2>Turn reviewed feedback into a better model.</h2>
          <p>
            Adaption is responsible for the reviewed-data optimization and
            future training workflow. Gemini remains the live analysis baseline
            until an Adaption-trained model is evaluated and approved.
          </p>
          <div className="adaption-hero-actions">
            <button
              className="button button-primary"
              onClick={() => {
                setRefreshVersion((value) => value + 1);
                notify("Refreshing Adaption connection and review readiness.");
              }}
              disabled={loading}
            >
              <Activity size={15} />
              {loading ? "Checking..." : "Refresh readiness"}
            </button>
            <span className="adaption-connection-detail">
              {connection?.available_base_models != null
                ? `${connection.available_base_models} base models listed`
                : connection?.message || "Waiting for connection status"}
            </span>
          </div>
        </div>
        <div className="lab-orbit" aria-hidden="true">
          <div className="lab-orbit-ring" />
          <div className="lab-orbit-ring second" />
          <div className="lab-orbit-core">
            <FlaskConical size={29} />
          </div>
          <span className="lab-orbit-point point-one" />
          <span className="lab-orbit-point point-two" />
          <span className="lab-orbit-point point-three" />
        </div>
      </div>

      {error && (
        <div className="adaption-inline-error" role="alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button
            className="button button-secondary"
            onClick={() => {
                setRefreshVersion((value) => value + 1);
                notify("Refreshing Adaption connection and review readiness.");
              }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="workspace-metric-grid">
        <WorkspaceStat
          title="Total feedback"
          value={String(readiness?.total_feedback ?? "—")}
          note="Records in the local workspace"
        />
        <WorkspaceStat
          title="AI analyzed"
          value={String(readiness?.analyzed_feedback ?? "—")}
          note="Records with a saved AI analysis"
        />
        <WorkspaceStat
          title="Human-approved examples"
          value={String(verifiedIds.length)}
          note="Approved review records; duplicates may exist"
        />
      </div>

      <div className="panel workspace-card adaption-readiness-card">
        <div className="panel-heading">
          <div>
            <h2>Verified-data readiness</h2>
            <p>
              Only examples explicitly approved after human review are counted
              toward the training dataset.
            </p>
          </div>
          <span className="workspace-status status-investigating">
            {readiness?.training_started ? "TRAINING STARTED" : "NO TRAINING RUN"}
          </span>
        </div>

        <div className="adaption-readiness-summary">
          <div>
            <strong>{verifiedCount.toLocaleString()}</strong>
            <span>approved examples</span>
          </div>
          <div>
            <strong>{Math.max(0, referenceTarget - verifiedCount).toLocaleString()}</strong>
            <span>additional examples to SFT reference target</span>
          </div>
        </div>

        <div
          className="bulk-progress-track adaption-reference-track"
          role="progressbar"
          aria-label="Verified examples versus SFT reference target"
          aria-valuemin={0}
          aria-valuemax={referenceTarget}
          aria-valuenow={Math.min(verifiedCount, referenceTarget)}
        >
          <span style={{ width: `${percentage}%` }} />
        </div>

        <div className="adaption-reference-caption">
          <span>{percentage}% of the {referenceTarget.toLocaleString()}-example SFT reference target</span>
          <span>{readiness?.stale_reviews ?? 0} stale reviews</span>
        </div>

        <div className="adaption-training-notice">
          <ShieldAlert size={17} />
          <p>
            Training will not start automatically. The SFT reference target
            is a planning threshold, not proof that a dataset is suitable.
            Reviewed examples must be representative and correct before any
            data is uploaded or a model run is launched.
          </p>
        </div>
      </div>

      <div className="panel workspace-card">
        <div className="panel-heading">
          <div>
            <h2>Approved examples</h2>
            <p>Feedback IDs explicitly approved from their AI insight panels.</p>
          </div>
          <div className="adaption-dataset-actions">
            <span className="workspace-status status-open">
              {verifiedIds.length} approved IDs
            </span>
            <button
              className="button button-secondary"
              onClick={downloadReviewedDataset}
              disabled={datasetExporting || loading || verifiedIds.length === 0}
            >
              <Download size={14} />
              {datasetExporting ? "Preparing..." : "Download reviewed CSV"}
            </button>
            <button
              className="button button-primary"
              onClick={uploadReviewedDatasetForEstimate}
              disabled={
                datasetUploading ||
                loading ||
                verifiedIds.length === 0 ||
                Boolean(readiness?.stale_reviews)
              }
              title={
                readiness?.stale_reviews
                  ? "Refresh and resolve stale reviews before uploading."
                  : "Upload approved examples to Adaption and request a cost estimate."
              }
            >
              <Upload size={14} />
              {datasetUploading
                ? "Uploading and estimating..."
                : "Upload to Adaption & estimate"}
            </button>
          </div>
        </div>

        {uploadEstimate && (
          <div className="adaption-upload-estimate" role="status" aria-live="polite">
            <div className="adaption-upload-estimate-heading">
              <strong>
                {uploadEstimate.estimate_available
                  ? "Adaption estimate received"
                  : "Dataset uploaded; estimate unavailable"}
              </strong>
              <span className="workspace-status status-open">
                {uploadEstimate.training_started ? "TRAINING STARTED" : "MODEL TRAINING NOT STARTED"}
              </span>
            </div>

            <div className="adaption-upload-estimate-stats">
              <div>
                <span>Approved rows uploaded</span>
                <strong>{uploadEstimate.record_count ?? 0}</strong>
              </div>
              <div>
                <span>Estimated credits</span>
                <strong>
                  {uploadEstimate.estimate_available
                    ? uploadEstimate.estimated_credits_consumed ?? "Not returned"
                    : "Unavailable"}
                </strong>
              </div>
              <div>
                <span>Estimated minutes</span>
                <strong>
                  {uploadEstimate.estimate_available
                    ? uploadEstimate.estimated_minutes ?? "Not returned"
                    : "Unavailable"}
                </strong>
              </div>
            </div>

            <p>
              Dataset ID: <code>{uploadEstimate.dataset_id}</code>
            </p>
            <p>{uploadEstimate.message}</p>

            {uploadEstimate.estimate_available && uploadEstimate.dataset_id && (
              <div className="adaption-dataset-actions">
                <button
                  className="button button-primary"
                  onClick={startAdaptionOptimization}
                  disabled={
                    optimizationStarting ||
                    datasetUploading ||
                    optimizationAlreadyStarted
                  }
                  title={
                    optimizationNeedsSafeRetry
                      ? "Retry using the same idempotency key."
                      : "Start the separately confirmed Adaption dataset-processing job."
                  }
                >
                  {optimizationStarting
                    ? "Starting optimization..."
                    : optimizationNeedsSafeRetry
                      ? "Retry launch safely"
                      : optimizationAlreadyStarted
                        ? "Optimization submitted"
                        : "Start Adaption optimization"}
                </button>

                <button
                  className="button button-secondary"
                  onClick={refreshAdaptionOptimizationStatus}
                  disabled={
                    optimizationChecking ||
                    !optimizationCanRefresh
                  }
                >
                  {optimizationChecking
                    ? "Refreshing status..."
                    : "Refresh optimization status"}
                </button>
              </div>
            )}

            {optimizationStatus && (
              <div className="adaption-upload-estimate" role="status" aria-live="polite">
                <div className="adaption-upload-estimate-heading">
                  <strong>Adaption optimization status</strong>
                  <span className="workspace-status status-open">
                    {(optimizationStatus.status || "UNKNOWN").toUpperCase()}
                  </span>
                </div>

                {optimizationStatus.run_id && (
                  <p>
                    Run ID: <code>{optimizationStatus.run_id}</code>
                  </p>
                )}

                {optimizationStatus.last_status_check && (
                  <p>
                    Last checked:{" "}
                    {new Date(optimizationStatus.last_status_check).toLocaleString()}
                  </p>
                )}

                <p>{optimizationStatus.message}</p>
                <p>
                  Dataset optimization is separate from model training.
                  InsightFlow has not automatically started an AutoScientist training run.
                </p>
              </div>
            )}
          </div>
        )}

        {verifiedIds.length === 0 ? (
          <div className="adaption-empty-state">
            <CircleHelp size={20} />
            <div>
              <strong>No reviewed examples yet</strong>
              <p>
                Open Feedback Hub, inspect an AI insight, and click
                “Approve for Adaption” only when the analysis is correct.
              </p>
            </div>
          </div>
        ) : (
          <div className="adaption-approved-list">
            {verifiedIds.slice(0, 20).map((id) => (
              <span className="adaption-approved-id" key={id}>
                <CheckCircle2 size={13} />
                {id}
              </span>
            ))}
            {verifiedIds.length > 20 && (
              <span className="adaption-approved-overflow">
                And {verifiedIds.length - 20} more...
              </span>
            )}
          </div>
        )}
      </div>

      <div className="workspace-note">
        <ShieldAlert size={17} />
        <div>
          <strong>Human review first, training second</strong>
          <p>
            Approval stores a snapshot of the selected feedback analysis.
            If the comment changes, the review is treated as stale. Approved examples are uploaded only after you explicitly confirm. Uploading and estimating does not start dataset adaptation or model training.
          </p>
        </div>
      </div>
    </section>
  );
}

function ReportsPage({
  feedback,
  sentimentCounts,
  onExport,
}: {
  feedback: Feedback[];
  sentimentCounts: {
    positive: number;
    neutral: number;
    negative: number;
    positivePct: number;
    neutralPct: number;
    negativePct: number;
    data: { name: string; value: number; color: string }[];
  };
  onExport: () => void;
}) {
  const [trendSource, setTrendSource] = useState<
    "loading" | "live" | "fallback"
  >("loading");

  const datedFeedback = feedback
    .map((item) => item.date.slice(0, 10))
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day))
    .sort();

  const earliestDate = datedFeedback[0];
  const latestDate = datedFeedback[datedFeedback.length - 1];

  const formatDate = (value?: string) => {
    if (!value) return "Not available";
    const parsed = new Date(`${value}T12:00:00`);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  };

  return (
    <section className="workspace-page">
      <div className="workspace-metric-grid">
        <WorkspaceStat
          title="Total records"
          value={feedback.length.toLocaleString()}
          note="Current workspace dataset"
        />
        <WorkspaceStat
          title="Positive labels"
          value={String(sentimentCounts.positive)}
          note={`${sentimentCounts.positivePct}% of current records`}
        />
        <WorkspaceStat
          title="Negative labels"
          value={String(sentimentCounts.negative)}
          note={`${sentimentCounts.negativePct}% of current records`}
        />
      </div>

      <div className="workspace-grid two-columns">
        <div className="panel workspace-card">
          <div className="panel-heading">
            <div>
              <h2>Sentiment trend report</h2>
              <p>
                Daily positive and negative counts from backend analytics
                when available.
              </p>
            </div>
            <span className="chart-caption">
              {trendSource === "live"
                ? "LIVE DATA"
                : trendSource === "loading"
                  ? "CONNECTING"
                  : "SAMPLE FALLBACK"}
            </span>
          </div>

          <div className="radar-live-label-row">
            <span className="radar-live-muted">
              Dataset: {formatDate(earliestDate)} – {formatDate(latestDate)}
            </span>
            <span className="radar-live-muted">
              {feedback.length} feedback records
            </span>
          </div>

          <TrendChart
            large
            onSourceChange={setTrendSource}
          />

          <div className="chart-footnote">
            <span className="footnote-dot" />
            {trendSource === "live"
              ? "Daily sentiment counts were loaded from the backend."
              : trendSource === "loading"
                ? "Checking the backend analytics endpoint."
                : "Backend analytics unavailable; illustrative chart values are shown instead."}
          </div>
        </div>

        <div className="panel workspace-card report-export-card">
          <div className="report-file-icon">
            <FileChartColumn size={24} />
          </div>

          <h2>Export feedback report</h2>
          <p>
            Download the current feedback dataset for spreadsheet analysis,
            sharing, or your next customer-experience review.
          </p>

          <div className="report-export-details">
            <span>
              <CheckCircle2 size={15} />
              Includes customer IDs and comment text
            </span>
            <span>
              <CheckCircle2 size={15} />
              Includes categories, sentiment, dates, and sources
            </span>
            <span>
              <CheckCircle2 size={15} />
              Uses the current feedback dataset
            </span>
          </div>

          <button
            className="button button-primary"
            onClick={onExport}
          >
            <Download size={15} />
            Export CSV report
          </button>
        </div>
      </div>
    </section>
  );
}
function FeedbackToolbar({ search, setSearch, sentimentFilter, setSentimentFilter }: { search: string; setSearch: (value: string) => void; sentimentFilter: string; setSentimentFilter: (value: string) => void }) {
  return <div className="feedback-toolbar"><label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search feedback, customers, categories..." /><kbd>⌘ K</kbd></label><label className="filter-select"><SlidersHorizontal size={14} /><select aria-label="Filter by sentiment" value={sentimentFilter} onChange={(event) => setSentimentFilter(event.target.value)}><option>All</option><option>Positive</option><option>Neutral</option><option>Negative</option></select></label><button className="filter-button" onClick={() => { setSearch(""); setSentimentFilter("All"); }}><X size={14} /> Reset</button></div>;
}

function FeedbackTable({ feedback, notify }: { feedback: Feedback[]; notify: (message: string) => void }) {
  return <div className="feedback-table-wrap"><table className="feedback-table"><thead><tr><th>CUSTOMER FEEDBACK</th><th>CATEGORY</th><th>SENTIMENT</th><th>DATE</th><th /></tr></thead><tbody>{feedback.map((item) => <tr key={item.id}><td><div className="feedback-cell"><SentimentIcon sentiment={item.sentiment} /><div className="feedback-text"><strong>{item.customer}</strong><span>{item.text}</span></div></div></td><td><span className="category-tag">{item.category}</span></td><td><span className={`sentiment-tag ${item.sentiment.toLowerCase()}`}><i />{item.sentiment}</span></td><td className="date-cell">{item.date}</td><td><button className="icon-button row-more" aria-label={`View ${item.id}`} onClick={() => notify(`${item.id} · ${item.source} · ${item.text}`)}><ChevronRight size={16} /></button></td></tr>)}{feedback.length === 0 && <tr><td colSpan={5} className="empty-state">No matching feedback. Try a different search or filter.</td></tr>}</tbody></table></div>;
}

function SentimentIcon({ sentiment }: { sentiment: Sentiment }) {
  return <div className={`feedback-icon ${sentiment.toLowerCase()}`}>{sentiment === "Positive" ? <CheckCircle2 size={16} /> : sentiment === "Negative" ? <AlertTriangle size={16} /> : <MessageSquareText size={16} />}</div>;
}

function TrendChart({
  large = false,
  onSourceChange,
}: {
  large?: boolean;
  onSourceChange?: (source: "live" | "fallback") => void;
}) {
  const [chartData, setChartData] = useState(trendData);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE_URL}/api/analytics`)
      .then((response) => {
        if (!response.ok) throw new Error("Analytics request failed");
        return response.json();
      })
      .then((result) => {
        if (cancelled) return;

        if (!Array.isArray(result.trend) || result.trend.length === 0) {
          onSourceChange?.("fallback");
          return;
        }

        const mapped = result.trend.map(
          (item: { date: string; Positive: number; Negative: number }) => ({
            day: item.date,
            positive: item.Positive,
            negative: item.Negative,
          })
        );

        if (
          !mapped.every(
            (item: { day: string; positive: number; negative: number }) =>
              Number.isFinite(item.positive) &&
              Number.isFinite(item.negative)
          )
        ) {
          onSourceChange?.("fallback");
          return;
        }

        setChartData(mapped);
        onSourceChange?.("live");
      })
      .catch(() => {
        if (!cancelled) onSourceChange?.("fallback");
      });

    return () => {
      cancelled = true;
    };
  }, [onSourceChange]);

  return (
    <div className={`trend-chart ${large ? "trend-chart-large" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 12, right: 5, left: -22, bottom: 0 }}
        >
          <defs>
            <linearGradient id="positiveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#29bd86" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#29bd86" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="negativeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ed6874" stopOpacity={0.16} />
              <stop offset="95%" stopColor="#ed6874" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--chart-grid)"
            strokeDasharray="4 5"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="positive"
            name="Positive signals"
            stroke="#29bd86"
            strokeWidth={2.5}
            fill="url(#positiveFill)"
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="negative"
            name="Negative signals"
            stroke="#ed6874"
            strokeWidth={2.5}
            fill="url(#negativeFill)"
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
const tooltipStyle = { background: "var(--tooltip-bg)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-primary)", fontSize: 12 };

function MetricCard({ title, value, change, positive, subtitle, icon, color }: { title: string; value: string; change: string; positive: boolean; subtitle: string; icon: ReactNode; color: string }) {
  return <div className="metric-card"><div className="metric-top"><span className="metric-title">{title}</span><span className={`metric-icon ${color}`}>{icon}</span></div><div className="metric-value">{value}</div><div className="metric-bottom"><span className={`metric-change ${positive ? "good" : "bad"}`}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{change}</span><span className="metric-subtitle">{subtitle}</span></div></div>;
}

function WorkspaceStat({ title, value, note }: { title: string; value: string; note: string }) {
  return <div className="panel workspace-stat"><span>{title}</span><strong>{value}</strong><small>{note}</small></div>;
}

function Modal({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><h2 id="modal-title">{title}</h2><p>{description}</p></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>{children}</div></div>;
}

export default App;
