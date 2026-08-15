// @vitest-environment jsdom
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const state = vi.hoisted(() => ({
  notifications: [] as Array<{ id: number; message: string; isRead: number; createdAt: Date }>,
  invalidationCount: 0,
}));

const invalidateNotifications = vi.hoisted(() => vi.fn(async () => {
  state.invalidationCount += 1;
  state.notifications.push({
    id: state.notifications.length + 1,
    message: "Reporte gerencial de ventas e IVA generado y exportado en PDF.",
    isRead: 0,
    createdAt: new Date(),
  });
}));

const mutationResult = (options?: { onSuccess?: (value?: unknown) => void; onError?: (error: Error) => void }) => ({
  isPending: false,
  mutate: vi.fn(),
  mutateAsync: vi.fn(async () => {
    const value = {
      fileName: "reporte-gerencial-ventas-iva.pdf",
      contentType: "application/pdf",
      dataBase64: "",
      size: 1024,
    };
    options?.onSuccess?.(value);
    return value;
  }),
});

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      taxConfigs: {
        get: { invalidate: vi.fn() },
        getSyncLogs: { invalidate: vi.fn() },
      },
      systemLogs: {
        notifications: { list: { invalidate: invalidateNotifications } },
      },
    }),
    organizations: { list: { useQuery: () => ({ data: [{ id: 1, name: "Empresa Demo", taxId: "30-71234567-9" }] }) } },
    taxConfigs: {
      get: { useQuery: () => ({ data: undefined }) },
      getSyncLogs: { useQuery: () => ({ data: [] }) },
      getManagerialReport: { useQuery: () => ({ data: undefined }) },
      save: { useMutation: (options: any) => mutationResult(options) },
      syncPointsOfSale: { useMutation: (options: any) => mutationResult(options) },
      verifyConnection: { useMutation: (options: any) => mutationResult(options) },
      sendInvoiceEmail: { useMutation: (options: any) => mutationResult(options) },
      notifyManagerialGenerated: { useMutation: (options: any) => mutationResult(options) },
    },
    reports: {
      export: { useMutation: (options: any) => mutationResult(options) },
    },
    systemLogs: {
      notifications: {
        list: { useQuery: () => ({ data: state.notifications, refetch: vi.fn() }) },
        update: { useMutation: (options: any) => mutationResult(options) },
      },
    },
  },
}));

import NotificationCenter from "../client/src/components/NotificationCenter";

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <>
      <NotificationCenter userId={1} />
      {children}
    </>
  ),
}));
vi.mock("@/components/PartnerOnly", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("@/components/ui/badge", () => ({ Badge: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span> }));
vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));
vi.mock("@/components/ui/input", () => ({ Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} /> }));
vi.mock("@/components/ui/label", () => ({ Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props}>{children}</label> }));
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/ui/switch", () => ({ Switch: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (value: boolean) => void }) => <input aria-label="Emisión automática" type="checkbox" checked={checked} onChange={event => onCheckedChange(event.target.checked)} /> }));
vi.mock("@/components/ui/table", () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));
vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import TaxConfig from "../client/src/pages/TaxConfig";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  state.notifications.length = 0;
  state.invalidationCount = 0;
  invalidateNotifications.mockClear();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:edv") });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("TaxConfig UI", () => {
  it("muestra en la campana el aviso inmediatamente después de exportar PDF", async () => {
    await act(async () => {
      root.render(<TaxConfig />);
    });

    const notificationButton = container.querySelector<HTMLButtonElement>("button[aria-label*='Notificaciones de socios']");
    expect(notificationButton?.getAttribute("aria-label")).toContain("0 sin leer");

    const exportPdfButton = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("Exportar PDF"));
    expect(exportPdfButton).toBeDefined();

    await act(async () => {
      exportPdfButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const refreshedNotificationButton = container.querySelector<HTMLButtonElement>("button[aria-label*='Notificaciones de socios']");
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
    expect(state.invalidationCount).toBe(1);
    expect(refreshedNotificationButton?.getAttribute("aria-label")).toContain("1 sin leer");
    expect(container.textContent).toContain("Reporte exportado. El socio recibió una notificación");
  });
});
