"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CreateUserDialog } from "./create-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import {
  getUsers,
  deleteUser,
  type UserRow,
} from "@/lib/actions/users";
import { useTranslations } from "next-intl";
import { Toast } from "@/components/ui/toast";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 10;

export function UsersClient() {
  const t = useTranslations("dashboard.users");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isPending, startTransition] = useTransition();

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const fetchUsers = useCallback(() => {
    startTransition(async () => {
      const result = await getUsers({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        sortOrder,
      });
      setUsers(result.users);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    });
  }, [page, debouncedSearch, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteUser(deleteTarget.id);
    setIsDeleting(false);
    if (result.success) {
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchUsers();
    } else {
      setDeleteOpen(false);
      setDeleteTarget(null);
      setDeleteError(
        result.error === "You cannot delete your own account"
          ? t("delete.selfDeleteError")
          : t("delete.error")
      );
    }
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const SortIcon =
    sortOrder === "asc" ? ArrowUp : sortOrder === "desc" ? ArrowDown : ArrowUpDown;

  const startItem = (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("createUser")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.email")}</TableHead>
              <TableHead>{t("table.role")}</TableHead>
              <TableHead>{t("table.plan")}</TableHead>
              <TableHead>
                <button
                  onClick={toggleSort}
                  className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                >
                  {t("table.createdAt")}
                  <SortIcon className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Spinner className="h-5 w-5" />
                    {t("loading")}
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name || "\u2014"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "ADMIN" ? "default" : "secondary"
                      }
                    >
                      {t(`roles.${user.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.planName || "\u2014"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setEditTarget(user);
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => {
                        setDeleteTarget(user);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("pagination.showing")} {startItem}\u2013{endItem}{" "}
            {t("pagination.of")} {total} {t("pagination.users")}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isPending}
              className="h-8 px-3"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("pagination.previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("pagination.page")} {page} {t("pagination.of")} {totalPages}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isPending}
              className="h-8 px-3"
            >
              {t("pagination.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchUsers}
      />

      {editTarget && (
        <EditUserDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditTarget(null);
          }}
          user={editTarget}
          onSuccess={fetchUsers}
        />
      )}

      {deleteTarget && (
        <DeleteUserDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) setDeleteTarget(null);
          }}
          userEmail={deleteTarget.email}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}

      {deleteError && (
        <Toast
          message={deleteError}
          variant="error"
          onClose={() => setDeleteError(null)}
        />
      )}
    </div>
  );
}
