import * as React from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";

const Breadcrumb = React.forwardRef(({ ...props }, ref) => (
  <nav ref={ref} aria-label="breadcrumb" {...props} />
))
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef(({ className = "", ...props }, ref) => (
  <ol
    ref={ref}
    className={`flex flex-wrap items-center gap-1.5 break-words text-sm text-[#8b7563] sm:gap-2.5 ${className}`}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef(({ className = "", ...props }, ref) => (
  <li
    ref={ref}
    className={`inline-flex items-center gap-1.5 ${className}`}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef(({ asChild, className = "", ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "a"
  // For asChild we just pass children if it's a Fragment, but actually Shadcn uses Slot.
  // Since we don't have Radix Slot, if asChild is true, we assume the child is a React element (like Link)
  // and we clone it to add classes.
  if (asChild && React.isValidElement(props.children)) {
    return React.cloneElement(props.children, {
      ref,
      className: `transition-colors hover:text-black font-black uppercase tracking-[0.14em] text-xs ${className} ${props.children.props.className || ""}`
    });
  }
  return (
    <Comp
      ref={ref}
      className={`transition-colors hover:text-black font-black uppercase tracking-[0.14em] text-xs ${className}`}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef(({ className = "", ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={`font-black text-black text-lg capitalize truncate ${className}`}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({ children, className = "", ...props }) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={`[&>svg]:size-3.5 text-[#8b7563]/50 font-black ${className}`}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({ className = "", ...props }) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={`flex h-9 w-9 items-center justify-center ${className}`}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
