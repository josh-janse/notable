/**
 * Dashboard Layout - Simplified for Initial Deployment
 *
 * This layout has been simplified to remove sidebar and breadcrumb navigation.
 * To restore full navigation, uncomment the imports and JSX below and remove SimpleHeader.
 */

import { SimpleHeader } from "@/components/layout/simple-header";

// Preserved imports for future restoration:
// import { AppSidebar } from "@/components/layout/app-sidebar";
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb";
// import { Separator } from "@/components/ui/separator";
// import {
//   SidebarInset,
//   SidebarProvider,
//   SidebarTrigger,
// } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SimpleHeader />
      <main className="flex-1">{children}</main>
    </div>
  );

  // Original layout with sidebar (commented for future restoration):
  // return (
  //   <SidebarProvider>
  //     <AppSidebar />
  //     <SidebarInset>
  //       <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
  //         <SidebarTrigger className="-ml-1" />
  //         <Separator
  //           className="mr-2 data-[orientation=vertical]:h-4"
  //           orientation="vertical"
  //         />
  //         <Breadcrumb>
  //           <BreadcrumbList>
  //             <BreadcrumbItem className="hidden md:block">
  //               <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
  //             </BreadcrumbItem>
  //             <BreadcrumbSeparator className="hidden md:block" />
  //             <BreadcrumbItem>
  //               <BreadcrumbPage>Home</BreadcrumbPage>
  //             </BreadcrumbItem>
  //           </BreadcrumbList>
  //         </Breadcrumb>
  //       </header>
  //       <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
  //     </SidebarInset>
  //   </SidebarProvider>
  // );
}
