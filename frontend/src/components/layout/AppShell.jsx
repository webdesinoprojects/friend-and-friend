import {
  ArrowLeft,
} from "lucide-react";

import { useNavigate, useLocation, Link } from "react-router-dom";
import { ComingSoonMessageButton, NotificationBell } from "../common/HeaderActions";
import WorkspaceAccountMenu from "./WorkspaceAccountMenu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

export default function AppShell({ type, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const pageName = pathParts[pathParts.length - 1] || "dashboard";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#fff7ed] text-[#14231f]">
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="z-[9999] shrink-0 border-b border-[#ecd9c8] bg-white/88 px-5 py-4 backdrop-blur-xl relative">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-[#fffaf3] transition hover:bg-[#d67f3d]"
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>
              <Breadcrumb className="ml-2 flex min-w-0 items-center">
                <BreadcrumbList className="gap-1.5">
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        to={`/app/${type}/dashboard`}
                        className="text-xs font-black uppercase tracking-[0.14em] text-[#8b7563] transition hover:text-black"
                      >
                        {type} Workspace
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-[#8b7563]/45" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="truncate text-lg font-black capitalize text-black">
                      {pageName.replace(/-/g, " ")}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <ComingSoonMessageButton />
              <span className="hidden h-8 w-px bg-[#e2e8f0] sm:block" />
              <WorkspaceAccountMenu />
            </div>
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3 md:p-5">
          {children}
        </div>
      </main>
    </div>
  );
}
