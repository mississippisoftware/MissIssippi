import { useCallback, useState } from "react";
import type { ChangeEvent } from "react";
import { readFirstSheetRows } from "../utils/xlsxParse";

export type ParseRowResult<TRow> = {
  row?: TRow;
  errors?: string[];
  warnings?: string[];
  skip?: boolean;
};

type BuildParseContextResult<TContext> = {
  context: TContext;
  errors?: string[];
  warnings?: string[];
};

export type XlsxParseResult<TRow, TContext = unknown> = {
  rows: TRow[];
  warnings: string[];
  errors: string[];
  context?: TContext;
};

type UseXlsxUploadParserOptions<TRow, TContext> = {
  buildParseContext?: (headerRow: unknown[], rows: unknown[][]) => BuildParseContextResult<TContext>;
  parseRow: (args: { row: unknown[]; rowNumber: number; context: TContext }) => ParseRowResult<TRow>;
  validateRow?: (row: TRow, context: TContext) => { errors?: string[]; warnings?: string[] } | string[];
  validateRows?: (rows: TRow[], context: TContext) => { errors?: string[]; warnings?: string[] } | string[];
  getReadErrorMessage?: (err: unknown) => string;
};

const appendValidationIssues = (
  target: { errors: string[]; warnings: string[] },
  result?: { errors?: string[]; warnings?: string[] } | string[]
) => {
  if (!result) return;
  if (Array.isArray(result)) {
    target.errors.push(...result);
    return;
  }
  if (result.errors?.length) {
    target.errors.push(...result.errors);
  }
  if (result.warnings?.length) {
    target.warnings.push(...result.warnings);
  }
};

export const useXlsxUploadParser = <TRow, TContext = undefined>(
  options: UseXlsxUploadParserOptions<TRow, TContext>
) => {
  const [isParsing, setIsParsing] = useState(false);

  const parseFile = useCallback(
    async (file: File): Promise<XlsxParseResult<TRow, TContext>> => {
      setIsParsing(true);
      try {
        const buffer = await file.arrayBuffer();
        const { rows: rawRows, errors: sheetErrors } = readFirstSheetRows(buffer);
        if (sheetErrors.length > 0) {
          return { rows: [], warnings: [], errors: sheetErrors };
        }

        const headerRow = rawRows[0] ?? [];
        const parseContextResult = options.buildParseContext
          ? options.buildParseContext(headerRow, rawRows)
          : ({ context: undefined as TContext } satisfies BuildParseContextResult<TContext>);

        const issueAccumulator = { errors: [] as string[], warnings: [] as string[] };
        if (parseContextResult.errors?.length) {
          issueAccumulator.errors.push(...parseContextResult.errors);
        }
        if (parseContextResult.warnings?.length) {
          issueAccumulator.warnings.push(...parseContextResult.warnings);
        }

        const context = parseContextResult.context;
        if (issueAccumulator.errors.length > 0) {
          return { rows: [], warnings: issueAccumulator.warnings, errors: issueAccumulator.errors, context };
        }

        const parsedRows: TRow[] = [];
        rawRows.slice(1).forEach((row, index) => {
          const rowNumber = index + 2;
          const parsed = options.parseRow({ row, rowNumber, context });
          if (parsed.skip) return;
          if (parsed.errors?.length) {
            issueAccumulator.errors.push(...parsed.errors);
          }
          if (parsed.warnings?.length) {
            issueAccumulator.warnings.push(...parsed.warnings);
          }
          if (parsed.row !== undefined) {
            parsedRows.push(parsed.row);
          }
        });

        if (options.validateRow) {
          parsedRows.forEach((row) => {
            appendValidationIssues(issueAccumulator, options.validateRow?.(row, context));
          });
        }
        appendValidationIssues(issueAccumulator, options.validateRows?.(parsedRows, context));

        return {
          rows: parsedRows,
          warnings: issueAccumulator.warnings,
          errors: issueAccumulator.errors,
          context,
        };
      } catch (err) {
        console.error(err);
        const message = options.getReadErrorMessage ? options.getReadErrorMessage(err) : "Failed to read file.";
        return { rows: [], warnings: [], errors: [message] };
      } finally {
        setIsParsing(false);
      }
    },
    [options]
  );

  return {
    isParsing,
    parseFile,
  };
};

type UseXlsxUploadOptions<TRow, TSummary, TDuplicate, TContext> = {
  buildParseContext?: (headerRow: unknown[], rows: unknown[][]) => BuildParseContextResult<TContext>;
  parseRow: (args: { row: unknown[]; rowNumber: number; context: TContext }) => ParseRowResult<TRow>;
  validateRow?: (row: TRow, context: TContext) => string[];
  detectDuplicates?: (rows: TRow[], context: TContext) => TDuplicate[];
  executeUpload: (rows: TRow[], context: TContext) => Promise<TSummary>;
  getReadErrorMessage?: (err: unknown) => string;
};

export const useXlsxUpload = <TRow, TSummary, TDuplicate = TRow, TContext = undefined>(
  options: UseXlsxUploadOptions<TRow, TSummary, TDuplicate, TContext>
) => {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<TRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<TSummary | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateRows, setDuplicateRows] = useState<TDuplicate[]>([]);
  const [context, setContext] = useState<TContext | null>(null);

  const reset = useCallback(() => {
    setFileName("");
    setRows([]);
    setParseErrors([]);
    setSummary(null);
    setShowDuplicateModal(false);
    setDuplicateRows([]);
    setContext(null);
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        reset();
        return;
      }

      setFileName(file.name);
      setRows([]);
      setParseErrors([]);
      setSummary(null);
      setShowDuplicateModal(false);
      setDuplicateRows([]);

      try {
        const buffer = await file.arrayBuffer();
        const { rows: rawRows, errors: sheetErrors } = readFirstSheetRows(buffer);
        if (sheetErrors.length > 0) {
          setParseErrors(sheetErrors);
          return;
        }

        const headerRow = rawRows[0] ?? [];
        const parsedContextResult = options.buildParseContext
          ? options.buildParseContext(headerRow, rawRows)
          : { context: undefined as TContext };
        if (parsedContextResult.errors && parsedContextResult.errors.length > 0) {
          setParseErrors(parsedContextResult.errors);
          setContext(parsedContextResult.context ?? null);
          return;
        }

        const nextContext = parsedContextResult.context;
        const nextRows: TRow[] = [];
        const nextErrors: string[] = [];

        rawRows.slice(1).forEach((row, index) => {
          const rowNumber = index + 2;
          const { row: parsedRow, errors, skip } = options.parseRow({
            row,
            rowNumber,
            context: nextContext,
          });
          if (skip) return;
          if (errors?.length) {
            nextErrors.push(...errors);
          }
          if (parsedRow !== undefined) {
            nextRows.push(parsedRow);
          }
        });

        if (options.validateRow) {
          nextRows.forEach((row) => {
            const errors = options.validateRow?.(row, nextContext) ?? [];
            if (errors.length) {
              nextErrors.push(...errors);
            }
          });
        }

        setContext(nextContext);
        setRows(nextRows);
        setParseErrors(nextErrors);
      } catch (err) {
        console.error(err);
        const message = options.getReadErrorMessage
          ? options.getReadErrorMessage(err)
          : "Failed to read file.";
        setParseErrors([message]);
      }
    },
    [options, reset]
  );

  const upload = useCallback(
    async (uploadOptions?: { ignoreDuplicates?: boolean }) => {
      if (rows.length === 0 || parseErrors.length > 0) {
        return null;
      }

      const nextContext = context as TContext;

      if (options.detectDuplicates && !uploadOptions?.ignoreDuplicates) {
        const duplicates = options.detectDuplicates(rows, nextContext);
        if (duplicates.length > 0) {
          setDuplicateRows(duplicates);
          setShowDuplicateModal(true);
          return null;
        }
      }

      setShowDuplicateModal(false);
      setDuplicateRows([]);
      setUploading(true);
      setSummary(null);
      try {
        const result = await options.executeUpload(rows, nextContext);
        setSummary(result);
        return result;
      } finally {
        setUploading(false);
      }
    },
    [context, options, parseErrors.length, rows]
  );

  return {
    fileName,
    rows,
    parseErrors,
    setParseErrors,
    uploading,
    summary,
    showDuplicateModal,
    duplicateRows,
    setRows,
    setSummary,
    setShowDuplicateModal,
    setDuplicateRows,
    handleFileChange,
    upload,
    reset,
  };
};
