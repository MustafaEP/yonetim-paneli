/**
 * Sidebar ve rotalarla aynı görünürlük kurallarını tek yerde tutar.
 * İzin kodları backend Permission enum ile aynıdır.
 */
export type PermissionCheck = (permission: string) => boolean;

export interface SidebarNavFlags {
  showNewMemberApplication: boolean;
  showMemberApplications: boolean;
  showMembersList: boolean;
  showMemberHistory: boolean;
  showRegions: boolean;
  showRoles: boolean;
  showDocumentsSection: boolean;
  showPdfGenerate: boolean;
  showDocumentTemplates: boolean;
  showDocumentMemberHistory: boolean;
  showUsers: boolean;
  showPanelUserApplications: boolean;
  showBranches: boolean;
  showAccounting: boolean;
  showPaymentsList: boolean;
  showPaymentQuickEntry: boolean;
  showAdvances: boolean;
  showInvoices: boolean;
  showReports: boolean;
  showNotifications: boolean;
  showSystemSettings: boolean;
  showSystemLogs: boolean;
  showInstitutions: boolean;
}

export function getSidebarNavFlags(hasPermission: PermissionCheck): SidebarNavFlags {
  // Üye Başvuruları: MEMBER_APPLICATIONS_VIEW veya onay/red (üye listesi izni yetmez)
  const showMemberApplications =
    hasPermission('MEMBER_APPLICATIONS_VIEW') ||
    hasPermission('MEMBER_APPROVE') ||
    hasPermission('MEMBER_REJECT');

  const showMembersList =
    hasPermission('MEMBER_LIST') || hasPermission('MEMBER_LIST_BY_PROVINCE');

  const showMemberHistory = hasPermission('MEMBER_HISTORY_VIEW');

  const showDocumentsSection =
    hasPermission('DOCUMENT_SYSTEM_ACCESS') ||
    hasPermission('DOCUMENT_TEMPLATE_MANAGE') ||
    hasPermission('DOCUMENT_MEMBER_HISTORY_VIEW') ||
    hasPermission('DOCUMENT_GENERATE_PDF');

  const showDocumentTemplates =
    hasPermission('DOCUMENT_TEMPLATE_MANAGE') || hasPermission('DOCUMENT_SYSTEM_ACCESS');

  const showDocumentMemberHistory =
    hasPermission('DOCUMENT_MEMBER_HISTORY_VIEW') || hasPermission('DOCUMENT_SYSTEM_ACCESS');

  return {
    showNewMemberApplication: hasPermission('MEMBER_CREATE_APPLICATION'),
    showMemberApplications,
    showMembersList,
    showMemberHistory,
    showRegions: hasPermission('REGION_LIST') || hasPermission('BRANCH_MANAGE'),
    showRoles: hasPermission('ROLE_LIST') || hasPermission('MEMBER_LIST_BY_PROVINCE'),
    showDocumentsSection,
    showPdfGenerate: hasPermission('DOCUMENT_GENERATE_PDF'),
    showDocumentTemplates,
    showDocumentMemberHistory,
    showUsers: hasPermission('USER_LIST'),
    showPanelUserApplications: hasPermission('PANEL_USER_APPLICATION_LIST'),
    showBranches: hasPermission('BRANCH_MANAGE'),
    showAccounting: hasPermission('ACCOUNTING_VIEW'),
    showPaymentsList: hasPermission('MEMBER_PAYMENT_LIST'),
    showPaymentQuickEntry:
      hasPermission('MEMBER_PAYMENT_ADD') || hasPermission('MEMBER_PAYMENT_LIST'),
    showAdvances: hasPermission('ADVANCE_VIEW'),
    showInvoices: hasPermission('INVOICE_VIEW'),
    showReports:
      hasPermission('REPORT_GLOBAL_VIEW') ||
      hasPermission('REPORT_REGION_VIEW') ||
      hasPermission('REPORT_MEMBER_STATUS_VIEW') ||
      hasPermission('REPORT_DUES_VIEW'),
    showNotifications:
      hasPermission('NOTIFY_ALL_MEMBERS') ||
      hasPermission('NOTIFY_REGION') ||
      hasPermission('NOTIFY_OWN_SCOPE'),
    showSystemSettings: hasPermission('SYSTEM_SETTINGS_VIEW'),
    showSystemLogs: hasPermission('LOG_VIEW_ALL') || hasPermission('LOG_VIEW_OWN_SCOPE'),
    showInstitutions: hasPermission('INSTITUTION_LIST'),
  };
}
