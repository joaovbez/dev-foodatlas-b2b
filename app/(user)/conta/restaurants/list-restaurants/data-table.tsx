"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type Restaurant = {
  id: string
  nome: string
  CNPJ: string
  unidade: string
  endereço: string
}

const data: Restaurant[] = [
  {
    id: "m5gr84i9",
    nome: "Restaurante 1",
    CNPJ: "04.693.001/0001-10",
    unidade: "Osasco",
    endereço: "Rua Antônio Ivo, 678, Osasco, SP",
  },
  {
    id: "3u1reuv4",
    nome: "Restaurante 2",
    CNPJ: "04.693.001/0001-10",
    unidade: "Shopping JK",
    endereço: "Rua Antônio Ivo, 678, Osasco, SP",
  },
  {
    id: "derv1ws0",
    nome: "Restaurante 3",
    CNPJ: "83.131.001/0001-10",
    unidade: "Villa Ema",
    endereço: "Rua Antônio Ivo, 678, Osasco, SP",
  },
  {
    id: "3u1reuv4",
    nome: "Restaurante 2",
    CNPJ: "04.693.001/0001-10",
    unidade: "Shopping JK",
    endereço: "Rua Antônio Ivo, 678, Osasco, SP",
  },
  {
    id: "derv1ws0",
    nome: "Restaurante 3",
    CNPJ: "83.131.001/0001-10",
    unidade: "Villa Ema",
    endereço: "Rua Antônio Ivo, 678, Osasco, SP",
  },
  {
    id: "3u1reuv4",
    nome: "Restaurante 2",
    CNPJ: "04.693.001/0001-10",
    unidade: "Shopping JK",
    endereço: "Rua Antônio Ivo, 678, Osasco, SP",
  },
  {
    id: "derv1ws0",
    nome: "Restaurante 3",
    CNPJ: "83.131.001/0001-10",
    unidade: "Villa Ema",
    endereço: "Rua Antônio Ivo, 678, Osasco, SP",
  },
  {
    id: "3u1reuv4",
    nome: "Restaurante 2",
    CNPJ: "04.693.001/0001-10",
    unidade: "Shopping JK",
    endereço: "Rua Antônio Ivo, 678, Osasco, SP",
  },
  {
    id: "derv1ws0",
    nome: "Restaurante 3",
    CNPJ: "83.131.001/0001-10",
    unidade: "Villa Ema",
    endereço: "Rua Antônio Ivo, 678, Osasco, SP",
  },
  {
    id: "3u1reuv4",
    nome: "Restaurante 2",
    CNPJ: "04.693.001/0001-10",
    unidade: "Shopping JK",
    endereço: "Rua Antônio Ivo, 678, Osasco, SP",
  },
  {
    id: "derv1ws0",
    nome: "Restaurante 3",
    CNPJ: "83.131.001/0001-10",
    unidade: "Villa Ema",
    endereço: "Rua Antônio Ivo, 678, Osasco, SP",
  },
]

export const columns: ColumnDef<Restaurant>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nome",
    header: "Nome",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("nome")}</div>
    ),
  },
  {
    accessorKey: "unidade",
    header: "Unidade",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("unidade")}</div>
    ),
  },
  {
    accessorKey: "endereço",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Endereço
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => <div>{row.getValue("endereço")}</div>,
  },
  {
    accessorKey: "CNPJ",
    header: () => <div className="text-right">CNPJ</div>,
    cell: ({ row }) => {      
      return <div className="text-right font-medium">{row.getValue("CNPJ")}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {    
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">                        
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <AlertDialog>
                <AlertDialogTrigger className="text-red relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0">Remover</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza que deseja remover este restaurante?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ao removê-lo, você perderá todos os dados relacionados ao mesmo e deverá configurar novamente suas integrações com o FoodAtlas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="bg-red text-bold">Sim, quero remover.</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>  
            </DropdownMenuItem>         
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function DataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Buscar pelo nome..."
          value={(table.getColumn("nome")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("nome")?.setFilterValue(event.target.value)
          } 
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Informações <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
