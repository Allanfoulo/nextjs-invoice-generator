# Component Library Documentation

## Overview

This document catalogs all UI components in the Invoice Generator application, including their usage patterns, props, and examples.

## Component Architecture

The component library is built on top of ShadCN UI with Radix UI primitives, providing accessible, customizable, and consistent UI components.

### Directory Structure
```
components/
├── auth/           # Authentication components
├── layout/         # Layout components
└── ui/            # Base UI components
```

## Layout Components

### AppShell (`components/layout/app-shell.tsx`)

Main application layout wrapper with theme provider and navigation.

**Usage:**
```tsx
import { AppShell } from '@/components/layout/app-shell'

function MyApp() {
  return (
    <AppShell>
      <div>Your app content</div>
    </AppShell>
  )
}
```

**Features:**
- Theme management
- Responsive layout
- Loading states
- Error boundaries

### AppHeader (`components/layout/app-header.tsx`)

Application header with navigation and user controls.

**Props:**
```tsx
interface AppHeaderProps {
  title?: string
  actions?: React.ReactNode
  showBackButton?: boolean
}
```

**Usage:**
```tsx
<AppHeader
  title="Dashboard"
  actions={<Button>Action</Button>}
  showBackButton={false}
/>
```

**Features:**
- Breadcrumb navigation
- User menu
- Theme toggle
- Mobile responsive

### AppSidebar (`components/layout/app-sidebar.tsx`)

Application sidebar with navigation menu.

**Features:**
- Collapsible sidebar
- Active route highlighting
- User profile section
- Quick actions

## Authentication Components

### LoginForm (`components/auth/login-form.tsx`)

Login form with email/password validation.

**Props:**
```tsx
interface LoginFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}
```

**Usage:**
```tsx
<LoginForm
  onSuccess={() => router.push('/dashboard')}
  onError={(error) => toast.error(error)}
/>
```

**Features:**
- Email/password validation
- Remember me option
- Loading states
- Error handling

## UI Components

### Button (`components/ui/button.tsx`)

Versatile button component with variants and sizes.

**Props:**
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

**Variants:**
- `default`: Primary button
- `destructive`: Danger action
- `outline`: Secondary action
- `secondary`: Tertiary action
- `ghost`: Minimal styling
- `link`: Link appearance

**Usage:**
```tsx
<Button variant="default" size="lg" isLoading={loading}>
  Save Changes
</Button>

<Button variant="outline" leftIcon={<PlusIcon />}>
  Add Item
</Button>
```

### Card (`components/ui/card.tsx`)

Container component with consistent styling.

**Props:**
```tsx
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}
```

**Sub-components:**
- `CardHeader`: Header section
- `CardTitle`: Title text
- `CardDescription`: Description text
- `CardContent`: Main content
- `CardFooter`: Footer section

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Client Information</CardTitle>
    <CardDescription>Manage client details</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

### Form Components

#### Form (`components/ui/form.tsx`)

Form wrapper with React Hook Form integration.

**Usage:**
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

#### Input (`components/ui/input.tsx`)

Text input field with validation states.

**Props:**
```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

**Usage:**
```tsx
<Input
  placeholder="Enter email"
  error={!!errors.email}
  helperText={errors.email?.message}
/>
```

#### Select (`components/ui/select.tsx`)

Dropdown select component.

**Usage:**
```tsx
<Select onValueChange={(value) => setValue('status', value)}>
  <SelectTrigger>
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="draft">Draft</SelectItem>
    <SelectItem value="sent">Sent</SelectItem>
    <SelectItem value="paid">Paid</SelectItem>
  </SelectContent>
</Select>
```

#### Textarea (`components/ui/textarea.tsx`)

Multi-line text input.

**Usage:**
```tsx
<Textarea
  placeholder="Enter description"
  rows={4}
/>
```

### Data Display Components

#### Table (`components/ui/table.tsx`)

Responsive table component with sorting and filtering.

**Props:**
```tsx
interface TableProps {
  data: any[]
  columns: TableColumn[]
  sortable?: boolean
  filterable?: boolean
  pagination?: boolean
}
```

**Usage:**
```tsx
<Table
  data={invoices}
  columns={[
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'client', label: 'Client', render: (row) => row.client.name },
    { key: 'total', label: 'Total', render: (row) => formatCurrency(row.total) },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={row.status}>{row.status}</Badge> }
  ]}
/>
```

#### ResponsiveTable (`components/ui/responsive-table.tsx`)

Mobile-responsive table that adapts to screen size.

**Features:**
- Horizontal scroll on mobile
- Card view on small screens
- Touch-friendly interactions

#### Badge (`components/ui/badge.tsx`)

Status indicator component.

**Props:**
```tsx
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}
```

**Usage:**
```tsx
<Badge variant="destructive">Overdue</Badge>
<Badge variant="default">Paid</Badge>
<Badge variant="outline">Draft</Badge>
```

### Navigation Components

#### Breadcrumb (`components/ui/breadcrumb.tsx`)

Navigation breadcrumb component.

**Usage:**
```tsx
<Breadcrumb
  items={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Invoices', href: '/invoices' },
    { label: 'Create Invoice' }
  ]}
/>
```

#### Navigation Menu (`components/ui/navigation-menu.tsx`)

Horizontal navigation menu.

**Features:**
- Dropdown submenus
- Active state indicators
- Mobile responsive

### Feedback Components

#### AlertDialog (`components/ui/alert-dialog.tsx`)

Modal dialog for confirmations.

**Usage:**
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### Toast (`components/ui/sonner.tsx`)

Toast notifications for user feedback.

**Usage:**
```tsx
import { toast } from 'sonner'

// Success
toast.success('Changes saved successfully')

// Error
toast.error('Failed to save changes')

// Loading
toast.promise(saveChanges, {
  loading: 'Saving...',
  success: 'Changes saved',
  error: 'Failed to save'
})
```

### Loading Components

#### Skeleton (`components/ui/skeleton.tsx`)

Loading skeleton for content placeholders.

**Usage:**
```tsx
<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-8 w-full" />
```

#### InlineSpinner (`components/ui/inline-spinner.tsx`)

Small loading spinner for inline loading states.

**Usage:**
```tsx
<InlineSpinner size="sm" />
<InlineSpinner size="md" />
<InlineSpinner size="lg" />
```

### Specialized Components

#### QuoteEditor (`app/(app)/quotes/_components/quote-editor.tsx`)

Comprehensive quote editing component.

**Features:**
- Dynamic item management
- Real-time calculations
- Client selection
- PDF preview
- Template selection

#### InvoiceEditor (`app/(app)/invoices/_components/invoice-editor.tsx`)

Comprehensive invoice editing component.

**Features:**
- Quote conversion
- Payment terms
- Deposit calculations
- PDF generation
- Status management

#### QuotePdfPreview (`components/ui/quote-pdf-preview.tsx`)

PDF preview component for quotes.

**Features:**
- Real-time preview
- Template selection
- Print optimization
- Download options

#### InvoicePdfPreview (`components/ui/invoice-pdf-preview.tsx`)

PDF preview component for invoices.

**Features:**
- Real-time preview
- Payment instructions
- Company branding
- Download options

## Component Patterns

### Form Patterns

#### Data Entry Forms
```tsx
function ClientForm() {
  const form = useForm<ClientFormData>()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* More fields */}
        </div>
        <Button type="submit">Save</Button>
      </form>
    </Form>
  )
}
```

#### Search and Filter Forms
```tsx
function InvoiceFilters() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Search invoices..." />
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Button>Apply Filters</Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Data Display Patterns

#### List Views
```tsx
function InvoiceList() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <InvoiceFilters />
      <Table data={invoices} columns={columns} />
    </div>
  )
}
```

#### Detail Views
```tsx
function InvoiceDetail() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Invoice Number</Label>
              <p>{invoice.invoice_number}</p>
            </div>
            <div>
              <Label>Status</Label>
              <Badge variant={invoice.status}>{invoice.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data={invoice.items} columns={itemColumns} />
        </CardContent>
      </Card>
    </div>
  )
}
```

## Accessibility

### ARIA Support
All components include proper ARIA attributes:
- `aria-label` for interactive elements
- `aria-describedby` for help text
- `aria-expanded` for expandable elements
- Proper focus management

### Keyboard Navigation
- Tab order follows logical sequence
- Enter/Space for interactive elements
- Escape for closing modals
- Arrow keys for navigation menus

### Screen Reader Support
- Semantic HTML elements
- Hidden labels for form fields
- Status announcements for dynamic content
- Error announcements for validation

## Styling System

### CSS Variables
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* More variables */
}
```

### Theme System
- Light/dark theme support
- Consistent color palette
- Responsive breakpoints
- Spacing scale

### Customization
- CSS custom properties
- Tailwind CSS classes
- Component-specific styles
- Theme context providers

## Performance Considerations

### Code Splitting
- Dynamic imports for large components
- Route-based component splitting
- Lazy loading for modals

### Optimization
- React.memo for expensive components
- useCallback for event handlers
- useMemo for computed values
- Virtual scrolling for large lists

---

**Document Status:** Active
**Last Updated:** 2025-09-25
**Component Library Version:** 1.0