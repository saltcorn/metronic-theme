const {
  div,
  text,
  a,
  p,
  footer,
  section,
  style,
  h1,
  aside,
  span,
  i,
  nav,
  ul,
  li,
  img,
} = require("@saltcorn/markup/tags");
const {
  navbar,
  navbarSolidOnScroll,
} = require("@saltcorn/markup/layout_utils");
const renderLayout = require("@saltcorn/markup/layout");
const Field = require("@saltcorn/data/models/field");
const Table = require("@saltcorn/data/models/table");
const Form = require("@saltcorn/data/models/form");
const View = require("@saltcorn/data/models/view");
const Workflow = require("@saltcorn/data/models/workflow");
const { renderForm, link } = require("@saltcorn/markup");
const {
  alert,
  headersInHead,
  headersInBody,
} = require("@saltcorn/markup/layout_utils");
const { features } = require("@saltcorn/data/db/state");

const verstring = features?.version_plugin_serve_path
  ? "@" + require("./package.json").version
  : "";

const blockDispatch = (config) => ({
  pageHeader: ({ title, blurb }) =>
    div(
      h1({ class: "h3 mb-0 mt-2 text-gray-800" }, title),
      blurb && p({ class: "mb-0 text-gray-800" }, blurb)
    ),
  footer: ({ contents }) =>
    div(
      { class: "container" },
      footer(
        { id: "footer" },
        div({ class: "row" }, div({ class: "col-sm-12" }, contents))
      )
    ),
  hero: ({ caption, blurb, cta, backgroundImage }) =>
    section(
      {
        class:
          "jumbotron text-center m-0 bg-info d-flex flex-column justify-content-center",
      },
      div(
        { class: "container" },
        h1({ class: "jumbotron-heading" }, caption),
        p({ class: "lead" }, blurb),
        cta
      ),
      backgroundImage &&
        style(`.jumbotron {
      background-image: url("${backgroundImage}");
      background-size: cover;
      min-height: 75vh !important;
    }`)
    ),
  noBackgroundAtTop: () => true,
  wrapTop: (segment, ix, s) =>
    ["hero", "footer"].includes(segment.type)
      ? s
      : section(
          {
            class: [
              "page-section",
              `pt-2`,
              ix === 0 && config.fixedTop && "mt-5",
              segment.class,
              segment.invertColor && "bg-primary",
            ],
            style: `${
              segment.bgType === "Color"
                ? `background-color: ${segment.bgColor};`
                : ""
            }
            ${
              segment.bgType === "Image" &&
              segment.bgFileId &&
              +segment.bgFileId
                ? `background-image: url('/files/serve/${segment.bgFileId}');
        background-size: ${segment.imageSize || "contain"};
        background-repeat: no-repeat;`
                : ""
            }`,
          },
          div(
            {
              class: `${
                segment.textStyle && segment.textStyle !== "h1"
                  ? segment.textStyle
                  : ""
              }`,
            },
            segment.textStyle && segment.textStyle === "h1" ? h1(s) : s
          )
        ),
});

const renderBody = (title, body, alerts, config, role) =>
  renderLayout({
    blockDispatch: blockDispatch(config),
    role,
    layout:
      typeof body === "string" && config.in_card
        ? { type: "card", title, contents: body }
        : body,
    alerts,
  });

const sidebar = (brand, sections, currentUrl) =>
  aside(
    { class: "main-sidebar sidebar-bg-dark sidebar-color-primary shadow" },
    div(
      { class: "brand-container" },
      a(
        {
          class: "brand-link",
          href: "/",
        },
        brand.logo &&
          img({
            src: brand.logo,
            width: "30",
            height: "30",
            class: "brand-image opacity-75 shadow",
            alt: "Logo",
            loading: "lazy",
          }),
        span({ class: "brand-text font-weight-light" }, brand.name)
      ),
      a(
        {
          class: "pushmenu mx-1",
          "data-lte-toggle": "sidebar-mini",
          href: "javascript:;",
          role: "button",
        },
        i({ class: "fas fa-angle-double-left" })
      )
    ),
    div(
      { class: "sidebar" },
      nav(
        { class: "mt-2" },
        ul(
          {
            class: "nav nav-pills nav-sidebar flex-column",
            "data-lte-toggle": "treeview",
            role: "menu",
            "data-accordion": "false",
            id: "accordionSidebar",
          },
          sections.map(sideBarSection(currentUrl))
        )
      )
    )
  );

const sideBarSection = (currentUrl) => (section) =>
  [
    section.section &&
      section.section !== "Menu" &&
      li({ class: "nav-header" }, section.section),
    section.items.map(sideBarItem(currentUrl)).join(""),
  ];

const sideBarItem = (currentUrl) => (item) => {
  const is_active = active(currentUrl, item);
  return li(
    {
      class: [
        "nav-item",
        item.subitems && is_active && "menu-open",
        item.isUser && "admlte-user-navbar",
      ],
    },
    item.link
      ? a(
          {
            class: ["nav-link", is_active && "active"],
            href: text(item.link),
            target: item.target_blank ? "_blank" : undefined,
          },
          item.icon ? i({ class: `nav-icon ${item.icon}` }) : "",

          p(text(item.label))
        )
      : item.subitems
      ? [
          a(
            {
              class: ["nav-link", is_active && "active"],
              href: "javascript:;",
            },
            item.icon ? i({ class: `nav-icon ${item.icon}` }) : "",
            p(text(item.label), i({ class: "end fas fa-angle-left" }))
          ),
          ul(
            {
              class: ["nav nav-treeview"],
            },
            item.subitems.map(subItem(currentUrl))
          ),
        ]
      : span({ class: "nav-link" }, text(item.label))
  );
};

const subItem = (currentUrl) => (item) =>
  li(
    { class: "nav-item" },
    item.link
      ? a(
          {
            class: [
              "nav-link",
              active(currentUrl, item) && "active",
              item.class,
            ],
            target: item.target_blank ? "_blank" : undefined,
            href: text(item.link),
          },
          item.icon
            ? i({ class: `nav-icon ${item.icon}` })
            : i({ class: "far fa-circle nav-icon" }),
          p(item.label)
        )
      : a(
          {
            class: ["nav-link"],
            href: "javascript:;",
          },
          item.label
        )
  );

// Helper function to figure out if a menu item is active.
const active = (currentUrl, item) =>
  (item.link && currentUrl.startsWith(item.link)) ||
  (item.subitems &&
    item.subitems.some((si) => si.link && currentUrl.startsWith(si.link)));

const wrapIt = (config, bodyAttr, headers, title, body) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <!-- Font -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700">
    <!-- Vendor Stylesheets -->
		<link href="/plugins/public/metronic-theme${verstring}/assets/plugins/custom/fullcalendar/fullcalendar.bundle.css" rel="stylesheet" type="text/css" />
		<link href="/plugins/public/metronic-theme${verstring}/assets/plugins/custom/datatables/datatables.bundle.css" rel="stylesheet" type="text/css" />
		<!--Global Stylesheets Bundle-->
		<link href="/plugins/public/metronic-theme${verstring}/assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
		<link href="/plugins/public/metronic-theme${verstring}/assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
    <!-- Google Fonts -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap">
    <!-- Material Design Bootstrap -->
    <link href="/plugins/public/metronic-theme${verstring}/css/mdb.min.css" rel="stylesheet">

    ${headersInHead(headers)}    
    <title>${text(title)}</title>
  </head>

  <body ${bodyAttr}>
    ${body}
    <script src="https://code.jquery.com/jquery-3.4.1.min.js" 
            integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" 
            crossorigin="anonymous"></script>
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.4/umd/popper.min.js"></script>

    <!-- MDB core JavaScript -->
    <script type="text/javascript" src="/plugins/public/metronic-theme${verstring}/js/mdb.min.js"></script>

    ${headersInBody(headers)}
    ${config.colorscheme === "navbar-light" ? navbarSolidOnScroll : ""}

    <!--begin::Aside--> 
    <div id="kt_aside" class="aside pt-7 pb-4 pb-lg-7 pt-lg-17" >
      <!--begin::Brand-->
      <div class="aside-logo flex-column-auto px-9 mb-9 mb-lg-17 mx-auto" id="kt_aside_logo">
        <!--begin::Logo-->
        <a href="../../demo15/dist/index.html">
          <img alt="Logo" src="assets/media/logos/default.svg" class="h-30px logo theme-light-show" />
          <img alt="Logo" src="assets/media/logos/default-dark.svg" class="h-30px logo theme-dark-show" />
        </a>
        <!--end::Logo-->
      </div>
      <!--end::Brand-->

      <!--begin::Aside user-->
      <div class="aside-user mb-5 mb-lg-10" id="kt_aside_user">
        <!--begin::User-->
        <div class="d-flex align-items-center flex-column">
          <!--begin::Symbol-->
          <div class="symbol symbol-75px mb-4">
            <img src="assets/media/avatars/300-1.jpg" alt="" />
          </div>
          <!--end::Symbol-->
          <!--begin::Info-->
          <div class="text-center">

            <!--begin::Username-->
            <a href="../../demo15/dist/pages/user-profile/overview.html" class="text-gray-800 text-hover-primary fs-4 fw-bolder">Paul Melone</a>
            <!--end::Username-->

            <!--begin::Description-->
            <span class="text-gray-600 fw-semibold d-block fs-7 mb-1">Python Dev</span>
            <!--end::Description-->

          </div>
          <!--end::Info-->
        </div>
        <!--end::User-->
      </div>
      <!--end::Aside user-->
      
      <!--begin::Aside menu-->
      <div class="aside-menu flex-column-fluid ps-3 ps-lg-5 pe-1 mb-9" id="kt_aside_menu">
        <!--begin::Aside Menu-->
        <div class="w-100 hover-scroll-overlay-y pe-2 me-2" id="kt_aside_menu_wrapper" data-kt-scroll="true" data-kt-scroll-activate="{default: false, lg: true}" data-kt-scroll-height="auto" data-kt-scroll-dependencies="#kt_aside_logo, #kt_aside_user, #kt_aside_footer" data-kt-scroll-wrappers="#kt_aside, #kt_aside_menu, #kt_aside_menu_wrapper" data-kt-scroll-offset="0">
          <!--begin::Menu-->
          <div class="menu menu-column menu-rounded menu-sub-indention menu-active-bg fw-semibold" id="#kt_aside_menu" data-kt-menu="true">

            <!--begin:Menu item Utilities-->
            <div data-kt-menu-trigger="click" class="menu-item menu-accordion">
              <!--begin:Menu link-->
              <span class="menu-link">
                <span class="menu-icon">
                  <i class="ki-duotone ki-abstract-35 fs-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                </span>
                <span class="menu-title">Utilities</span>
                <span class="menu-arrow"></span>
              </span>
              <!--end:Menu link-->

              <!--begin:Menu sub : Utilities-dropdownMenu-->
              <div class="menu-sub menu-sub-accordion">
                <!--begin:Menu item : Utilities/Modals-->
                <div data-kt-menu-trigger="click" class="menu-item menu-accordion">
                  <!--begin:Menu link-->
                  <span class="menu-link">
                    <span class="menu-bullet">
                      <span class="bullet bullet-dot"></span>
                    </span>
                    <span class="menu-title">Modals</span>
                    <span class="menu-arrow"></span>
                  </span>
                  <!--end:Menu link-->
                  <!--begin:Menu sub-->
                  <div class="menu-sub menu-sub-accordion menu-active-bg">
                    <!--begin:Menu item-->
                    <div data-kt-menu-trigger="click" class="menu-item menu-accordion">
                      <!--begin:Menu link-->
                      <span class="menu-link">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">General</span>
                        <span class="menu-arrow"></span>
                      </span>
                      <!--end:Menu link-->
                      <!--begin:Menu sub-->
                      <div class="menu-sub menu-sub-accordion menu-active-bg">
                        <!--begin:Menu item-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/general/invite-friends.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Invite Friends</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->
                        <!--begin:Menu item-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/general/view-users.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">View Users</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->
                        <!--begin:Menu item-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/general/select-users.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Select Users</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->
                        <!--begin:Menu item-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/general/upgrade-plan.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Upgrade Plan</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->
                        <!--begin:Menu item-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/general/share-earn.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Share & Earn</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->
                      </div>
                      <!--end:Menu sub-->
                    </div>
                    <!--end:Menu item-->

                    <!--begin:Menu item Bullet+Forms-->
                    <div data-kt-menu-trigger="click" class="menu-item menu-accordion">
                      <!--begin:Menu link-->
                      <span class="menu-link">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Forms</span>
                        <span class="menu-arrow"></span>
                      </span>
                      <!--end:Menu link-->

                      <!--begin:Menu sub Utilities/modals/forms-->
                      <div class="menu-sub menu-sub-accordion menu-active-bg">

                        <!--begin:Menu item utilities/modals/forms/newTarget-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/forms/new-target.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">New Target</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->

                        <!--begin:Menu item utilities/modals/forms/newCard-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/forms/new-card.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">New Card</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->

                        <!--begin:Menu item utilities/modals/forms/newAddress-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/forms/new-address.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">New Address</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->

                        <!--begin:Menu item  utilities/modals/forms/createAPIkey-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/forms/create-api-key.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Create API Key</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->

                        <!--begin:Menu item utilities/modals/forms/bidding-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/forms/bidding.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Bidding</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->

                      </div>
                      <!--end:Menu sub-->
                    </div>
                    <!--end:Menu item-->

                    <!--begin:Menu item Bullet+Wizards-->
                    <div data-kt-menu-trigger="click" class="menu-item menu-accordion">
                      <!--begin:Menu link-->
                      <span class="menu-link">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Wizards</span>
                        <span class="menu-arrow"></span>
                      </span>
                      <!--end:Menu link-->

                      <!--begin:Menu sub Utilities/modals/wizards-->
                      <div class="menu-sub menu-sub-accordion menu-active-bg">

                        <!--begin:Menu item Utilities/modals/wizards/createApp-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/wizards/create-app.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Create App</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->

                        <!--begin:Menu item Utilities/modals/wizards/createCampaign-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/wizards/create-campaign.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Create Campaign</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->

                        <!--begin:Menu item Utilities/modals/wizards/CreateBusinessAcc-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/wizards/create-account.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Create Business Acc</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->

                        <!--begin:Menu item Utilities/modals/wizards/CreateProject-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/wizards/create-project.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Create Project</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->

                        <!--begin:Menu item Utilities/modals/wizards/TopUpWallet-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/wizards/top-up-wallet.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Top Up Wallet</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->

                        <!--begin:Menu item Utilities/modals/wizards/OfferaDeal-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/wizards/offer-a-deal.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Offer a Deal</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->

                        <!--begin:Menu item Utilities/modals/wizards/TwoFactorAuth-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/wizards/two-factor-authentication.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Two Factor Auth</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->
                      </div>
                      <!--end:Menu sub-->

                    </div>
                    <!--end:Menu item-->

                    <!--begin:Menu item Bullet+Search-->
                    <div data-kt-menu-trigger="click" class="menu-item menu-accordion">
                      <!--begin:Menu link-->
                      <span class="menu-link">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Search</span>
                        <span class="menu-arrow"></span>
                      </span>
                      <!--end:Menu link-->
                      <!--begin:Menu sub-->
                      <div class="menu-sub menu-sub-accordion menu-active-bg">
                        <!--begin:Menu item-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/search/users.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Users</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->
                        <!--begin:Menu item-->
                        <div class="menu-item">
                          <!--begin:Menu link-->
                          <a class="menu-link" href="../../demo15/dist/utilities/modals/search/select-location.html">
                            <span class="menu-bullet">
                              <span class="bullet bullet-dot"></span>
                            </span>
                            <span class="menu-title">Select Location</span>
                          </a>
                          <!--end:Menu link-->
                        </div>
                        <!--end:Menu item-->
                      </div>
                      <!--end:Menu sub-->
                    </div>
                    <!--end:Menu item-->

                  </div>
                  <!--end:Menu sub-->
                </div>
                <!--end:Menu item-->

                <!--begin:Menu item : Utilities/Wizards-->
                <div data-kt-menu-trigger="click" class="menu-item menu-accordion">
                  <!--begin:Menu link-->
                  <span class="menu-link">
                    <span class="menu-bullet">
                      <span class="bullet bullet-dot"></span>
                    </span>
                    <span class="menu-title">Wizards</span>
                    <span class="menu-arrow"></span>
                  </span>
                  <!--end:Menu link-->

                  <!--begin:Menu sub Utilities/Wizards-->
                  <div class="menu-sub menu-sub-accordion menu-active-bg">
                    <!--begin:Menu item-->
                    <div class="menu-item">
                      <!--begin:Menu link-->
                      <a class="menu-link" href="../../demo15/dist/utilities/wizards/horizontal.html">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Horizontal</span>
                      </a>
                      <!--end:Menu link-->
                    </div>
                    <!--end:Menu item-->
                    <!--begin:Menu item-->
                    <div class="menu-item">
                      <!--begin:Menu link-->
                      <a class="menu-link" href="../../demo15/dist/utilities/wizards/vertical.html">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Vertical</span>
                      </a>
                      <!--end:Menu link-->
                    </div>
                    <!--end:Menu item-->
                    <!--begin:Menu item-->
                    <div class="menu-item">
                      <!--begin:Menu link-->
                      <a class="menu-link" href="../../demo15/dist/utilities/wizards/two-factor-authentication.html">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Two Factor Auth</span>
                      </a>
                      <!--end:Menu link-->
                    </div>
                    <!--end:Menu item-->
                    <!--begin:Menu item-->
                    <div class="menu-item">
                      <!--begin:Menu link-->
                      <a class="menu-link" href="../../demo15/dist/utilities/wizards/create-app.html">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Create App</span>
                      </a>
                      <!--end:Menu link-->
                    </div>
                    <!--end:Menu item-->
                    <!--begin:Menu item-->
                    <div class="menu-item">
                      <!--begin:Menu link-->
                      <a class="menu-link" href="../../demo15/dist/utilities/wizards/create-campaign.html">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Create Campaign</span>
                      </a>
                      <!--end:Menu link-->
                    </div>
                    <!--end:Menu item-->
                    <!--begin:Menu item-->
                    <div class="menu-item">
                      <!--begin:Menu link-->
                      <a class="menu-link" href="../../demo15/dist/utilities/wizards/create-account.html">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Create Account</span>
                      </a>
                      <!--end:Menu link-->
                    </div>
                    <!--end:Menu item-->
                    <!--begin:Menu item-->
                    <div class="menu-item">
                      <!--begin:Menu link-->
                      <a class="menu-link" href="../../demo15/dist/utilities/wizards/create-project.html">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Create Project</span>
                      </a>
                      <!--end:Menu link-->
                    </div>
                    <!--end:Menu item-->
                    <!--begin:Menu item-->
                    <div class="menu-item">
                      <!--begin:Menu link-->
                      <a class="menu-link" href="../../demo15/dist/utilities/modals/wizards/top-up-wallet.html">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Top Up Wallet</span>
                      </a>
                      <!--end:Menu link-->
                    </div>
                    <!--end:Menu item-->
                    <!--begin:Menu item-->
                    <div class="menu-item">
                      <!--begin:Menu link-->
                      <a class="menu-link" href="../../demo15/dist/utilities/wizards/offer-a-deal.html">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Offer a Deal</span>
                      </a>
                      <!--end:Menu link-->
                    </div>
                    <!--end:Menu item-->
                  </div>
                  <!--end:Menu sub-->
                </div>
                <!--end:Menu item-->

                <!--begin:Menu item : Utilities/Search-->
                <div data-kt-menu-trigger="click" class="menu-item menu-accordion">
                  <!--begin:Menu link-->
                  <span class="menu-link">
                    <span class="menu-bullet">
                      <span class="bullet bullet-dot"></span>
                    </span>
                    <span class="menu-title">Search</span>
                    <span class="menu-arrow"></span>
                  </span>
                  <!--end:Menu link-->
                  <!--begin:Menu sub-->
                  <div class="menu-sub menu-sub-accordion menu-active-bg">

                    <!--begin:Menu item Utilities/Horizontal-->
                    <div class="menu-item">
                      <!--begin:Menu link-->
                      <a class="menu-link" href="../../demo15/dist/utilities/search/horizontal.html">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Horizontal</span>
                      </a>
                      <!--end:Menu link-->
                    </div>
                    <!--end:Menu item-->

                    <!--begin:Menu item Utilities/Vertical-->
                    <div class="menu-item">
                      <!--begin:Menu link-->
                      <a class="menu-link" href="../../demo15/dist/utilities/search/vertical.html">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Vertical</span>
                      </a>
                      <!--end:Menu link-->
                    </div>
                    <!--end:Menu item-->

                    <!--begin:Menu item Utilities/Users-->
                    <div class="menu-item">
                      <!--begin:Menu link-->
                      <a class="menu-link" href="../../demo15/dist/utilities/search/users.html">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Users</span>
                      </a>
                      <!--end:Menu link-->
                    </div>
                    <!--end:Menu item-->

                    <!--begin:Menu item Utilities/Location-->
                    <div class="menu-item">
                      <!--begin:Menu link-->
                      <a class="menu-link" href="../../demo15/dist/utilities/search/select-location.html">
                        <span class="menu-bullet">
                          <span class="bullet bullet-dot"></span>
                        </span>
                        <span class="menu-title">Location</span>
                      </a>
                      <!--end:Menu link-->
                    </div>
                    <!--end:Menu item-->

                  </div>
                  <!--end:Menu sub-->
                </div>
                <!--end:Menu item-->

              </div>
              <!--end:Menu sub-->
            </div>
            <!--end:Menu item-->

            <!--begin:Menu item : Help-->
            <div data-kt-menu-trigger="click" class="menu-item menu-accordion">
              <!--begin:Menu link-->
              <span class="menu-link">
                <span class="menu-icon">
                  <i class="ki-duotone ki-briefcase fs-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                </span>
                <span class="menu-title">Help</span>
                <span class="menu-arrow"></span>
              </span>
              <!--end:Menu link-->
              <!--begin:Menu sub-->
              <div class="menu-sub menu-sub-accordion">
                <!--begin:Menu item-->
                <div class="menu-item">
                  <!--begin:Menu link-->
                  <a class="menu-link" href="https://preview.keenthemes.com/html/metronic/docs/base/utilities" target="_blank" title="Check out over 200 in-house components" data-bs-toggle="tooltip" data-bs-trigger="hover" data-bs-dismiss="click" data-bs-placement="right">
                    <span class="menu-bullet">
                      <span class="bullet bullet-dot"></span>
                    </span>
                    <span class="menu-title">Components</span>
                  </a>
                  <!--end:Menu link-->
                </div>
                <!--end:Menu item-->
                <!--begin:Menu item-->
                <div class="menu-item">
                  <!--begin:Menu link-->
                  <a class="menu-link" href="https://preview.keenthemes.com/html/metronic/docs" target="_blank" title="Check out the complete documentation" data-bs-toggle="tooltip" data-bs-trigger="hover" data-bs-dismiss="click" data-bs-placement="right">
                    <span class="menu-bullet">
                      <span class="bullet bullet-dot"></span>
                    </span>
                    <span class="menu-title">Documentation</span>
                  </a>
                  <!--end:Menu link-->
                </div>
                <!--end:Menu item-->
                <!--begin:Menu item-->
                <div class="menu-item">
                  <!--begin:Menu link-->
                  <a class="menu-link" href="https://preview.keenthemes.com/metronic8/demo15/layout-builder.html" title="Build your layout and export HTML for server side integration" data-bs-toggle="tooltip" data-bs-trigger="hover" data-bs-dismiss="click" data-bs-placement="right">
                    <span class="menu-bullet">
                      <span class="bullet bullet-dot"></span>
                    </span>
                    <span class="menu-title">Layout Builder</span>
                  </a>
                  <!--end:Menu link-->
                </div>
                <!--end:Menu item-->
                <!--begin:Menu item-->
                <div class="menu-item">
                  <!--begin:Menu link-->
                  <a class="menu-link" href="https://preview.keenthemes.com/html/metronic/docs/getting-started/changelog" target="_blank">
                    <span class="menu-bullet">
                      <span class="bullet bullet-dot"></span>
                    </span>
                    <span class="menu-title">Changelog v8.2.0</span>
                  </a>
                  <!--end:Menu link-->
                </div>
                <!--end:Menu item-->
              </div>
              <!--end:Menu sub-->
            </div>
            <!--end:Menu item-->
          </div>
          <!--end::Menu-->
        </div>
        <!--end::Aside Menu-->
      </div>
      <!--end::Aside menu--></div>
      
      <!--begin::Footer-->
      <div class="aside-footer flex-column-auto px-6 px-lg-9" id="kt_aside_footer">
        <!--begin::User panel-->
        <div class="d-flex flex-stack ms-7">
          <!--begin::Link-->
          <a href="../../demo15/dist/authentication/flows/basic/sign-in.html" class="btn btn-sm btn-icon btn-active-color-primary btn-icon-gray-600 btn-text-gray-600">
            <i class="ki-duotone ki-entrance-left fs-1 me-2">
              <span class="path1"></span>
              <span class="path2"></span>
            </i>
            <!--begin::Major-->
            <span class="d-flex flex-shrink-0 fw-bold">Log Out</span>
            <!--end::Major-->
          </a>
          <!--end::Link-->
          <!--begin::User menu-->
          <div class="ms-1">
            <div class="btn btn-sm btn-icon btn-icon-gray-600 btn-active-color-primary position-relative me-n1" data-kt-menu-trigger="click" data-kt-menu-overflow="true" data-kt-menu-placement="top-start">
              <i class="ki-duotone ki-setting-2 fs-1">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
            </div>
            <!--begin::User account menu-->
            <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg menu-state-color fw-semibold py-4 fs-6 w-275px" data-kt-menu="true">
              <!--begin::Menu item-->
              <div class="menu-item px-3">
                <div class="menu-content d-flex align-items-center px-3">
                  <!--begin::Avatar-->
                  <div class="symbol symbol-50px me-5">
                    <img alt="Logo" src="assets/media/avatars/300-1.jpg" />
                  </div>
                  <!--end::Avatar-->
                  <!--begin::Username-->
                  <div class="d-flex flex-column">
                    <div class="fw-bold d-flex align-items-center fs-5">Max Smith
                    <span class="badge badge-light-success fw-bold fs-8 px-2 py-1 ms-2">Pro</span></div>
                    <a href="#" class="fw-semibold text-muted text-hover-primary fs-7">max@kt.com</a>
                  </div>
                  <!--end::Username-->
                </div>
              </div>
              <!--end::Menu item-->
              <!--begin::Menu separator-->
              <div class="separator my-2"></div>
              <!--end::Menu separator-->
              <!--begin::Menu item-->
              <div class="menu-item px-5">
                <a href="../../demo15/dist/account/overview.html" class="menu-link px-5">My Profile</a>
              </div>
              <!--end::Menu item-->
              <!--begin::Menu item-->
              <div class="menu-item px-5">
                <a href="../../demo15/dist/apps/projects/list.html" class="menu-link px-5">
                  <span class="menu-text">My Projects</span>
                  <span class="menu-badge">
                    <span class="badge badge-light-danger badge-circle fw-bold fs-7">3</span>
                  </span>
                </a>
              </div>
              <!--end::Menu item-->
              <!--begin::Menu item-->
              <div class="menu-item px-5" data-kt-menu-trigger="{default: 'click', lg: 'hover'}" data-kt-menu-placement="right-start" data-kt-menu-offset="-15px, 0">
                <a href="#" class="menu-link px-5">
                  <span class="menu-title">My Subscription</span>
                  <span class="menu-arrow"></span>
                </a>
                <!--begin::Menu sub-->
                <div class="menu-sub menu-sub-dropdown w-175px py-4">
                  <!--begin::Menu item-->
                  <div class="menu-item px-3">
                    <a href="../../demo15/dist/account/referrals.html" class="menu-link px-5">Referrals</a>
                  </div>
                  <!--end::Menu item-->
                  <!--begin::Menu item-->
                  <div class="menu-item px-3">
                    <a href="../../demo15/dist/account/billing.html" class="menu-link px-5">Billing</a>
                  </div>
                  <!--end::Menu item-->
                  <!--begin::Menu item-->
                  <div class="menu-item px-3">
                    <a href="../../demo15/dist/account/statements.html" class="menu-link px-5">Payments</a>
                  </div>
                  <!--end::Menu item-->
                  <!--begin::Menu item-->
                  <div class="menu-item px-3">
                    <a href="../../demo15/dist/account/statements.html" class="menu-link d-flex flex-stack px-5">Statements
                    <span class="ms-2 lh-0" data-bs-toggle="tooltip" title="View your statements">
                      <i class="ki-duotone ki-information-5 fs-5">
                        <span class="path1"></span>
                        <span class="path2"></span>
                        <span class="path3"></span>
                      </i>
                    </span></a>
                  </div>
                  <!--end::Menu item-->
                  <!--begin::Menu separator-->
                  <div class="separator my-2"></div>
                  <!--end::Menu separator-->
                  <!--begin::Menu item-->
                  <div class="menu-item px-3">
                    <div class="menu-content px-3">
                      <label class="form-check form-switch form-check-custom form-check-solid">
                        <input class="form-check-input w-30px h-20px" type="checkbox" value="1" checked="checked" name="notifications" />
                        <span class="form-check-label text-muted fs-7">Notifications</span>
                      </label>
                    </div>
                  </div>
                  <!--end::Menu item-->
                </div>
                <!--end::Menu sub-->
              </div>
              <!--end::Menu item-->
              <!--begin::Menu item-->
              <div class="menu-item px-5">
                <a href="../../demo15/dist/account/statements.html" class="menu-link px-5">My Statements</a>
              </div>
              <!--end::Menu item-->
              <!--begin::Menu separator-->
              <div class="separator my-2"></div>
              <!--end::Menu separator-->
              <!--begin::Menu item-->
              <div class="menu-item px-5" data-kt-menu-trigger="{default: 'click', lg: 'hover'}" data-kt-menu-placement="right-start" data-kt-menu-offset="-15px, 0">
                <a href="#" class="menu-link px-5">
                  <span class="menu-title position-relative">Language
                  <span class="fs-8 rounded bg-light px-3 py-2 position-absolute translate-middle-y top-50 end-0">English
                  <img class="w-15px h-15px rounded-1 ms-2" src="assets/media/flags/united-states.svg" alt="" /></span></span>
                </a>
                <!--begin::Menu sub-->
                <div class="menu-sub menu-sub-dropdown w-175px py-4">
                  <!--begin::Menu item-->
                  <div class="menu-item px-3">
                    <a href="../../demo15/dist/account/settings.html" class="menu-link d-flex px-5 active">
                    <span class="symbol symbol-20px me-4">
                      <img class="rounded-1" src="assets/media/flags/united-states.svg" alt="" />
                    </span>English</a>
                  </div>
                  <!--end::Menu item-->
                  <!--begin::Menu item-->
                  <div class="menu-item px-3">
                    <a href="../../demo15/dist/account/settings.html" class="menu-link d-flex px-5">
                    <span class="symbol symbol-20px me-4">
                      <img class="rounded-1" src="assets/media/flags/spain.svg" alt="" />
                    </span>Spanish</a>
                  </div>
                  <!--end::Menu item-->
                  <!--begin::Menu item-->
                  <div class="menu-item px-3">
                    <a href="../../demo15/dist/account/settings.html" class="menu-link d-flex px-5">
                    <span class="symbol symbol-20px me-4">
                      <img class="rounded-1" src="assets/media/flags/germany.svg" alt="" />
                    </span>German</a>
                  </div>
                  <!--end::Menu item-->
                  <!--begin::Menu item-->
                  <div class="menu-item px-3">
                    <a href="../../demo15/dist/account/settings.html" class="menu-link d-flex px-5">
                    <span class="symbol symbol-20px me-4">
                      <img class="rounded-1" src="assets/media/flags/japan.svg" alt="" />
                    </span>Japanese</a>
                  </div>
                  <!--end::Menu item-->
                  <!--begin::Menu item-->
                  <div class="menu-item px-3">
                    <a href="../../demo15/dist/account/settings.html" class="menu-link d-flex px-5">
                    <span class="symbol symbol-20px me-4">
                      <img class="rounded-1" src="assets/media/flags/france.svg" alt="" />
                    </span>French</a>
                  </div>
                  <!--end::Menu item-->
                </div>
                <!--end::Menu sub-->
              </div>
              <!--end::Menu item-->
              <!--begin::Menu item-->
              <div class="menu-item px-5 my-1">
                <a href="../../demo15/dist/account/settings.html" class="menu-link px-5">Account Settings</a>
              </div>
              <!--end::Menu item-->
              <!--begin::Menu item-->
              <div class="menu-item px-5">
                <a href="../../demo15/dist/authentication/layouts/corporate/sign-in.html" class="menu-link px-5">Sign Out</a>
              </div>
              <!--end::Menu item-->
            </div>
            <!--end::User account menu-->
          </div>
          <!--end::User menu-->
        </div>
        <!--end::User panel-->
      </div>
      <!--end::Footer-->
    </div>
    <!--end::Aside-->

    <style>
    table.table a {
      color:#007bff;
    }
    body {
      background-color: ${config.backgroundColor || "white"};
    }
    </style>

  </body>

</html>`;

const authBrand = (config, { name, logo }) =>
  logo
    ? `<img class="mb-4" src="${logo}" alt="Logo" width="72" height="72">`
    : "";

const layout = (config) => ({
  wrap: ({ title, menu, brand, alerts, currentUrl, body, headers, role }) => {
    console.log("menu", JSON.stringify(menu, null, 2));
    return wrapIt(
      config,
      'id="page-top"',
      headers,
      title,
      `
    <div id="wrapper">
    <!-- call the sidebar here-->
        ${sidebar(brand, menu, currentUrl)}
        <div class="container">
          <div class="row">
            <div class="col-sm-12" id="page-inner-content">
              ${renderBody(title, body, alerts, config, role)}
            </div>
          </div>
        </div>
    </div>
    `
    );
  },
  renderBody: ({ title, body, alerts, role }) =>
    renderBody(title, body, alerts, config, role),
  authWrap: ({
    title,
    alerts, //TODO
    form,
    afterForm,
    headers,
    brand,
    csrfToken,
    authLinks,
  }) =>
    wrapIt(
      config,
      'class="text-center"',
      headers,
      title,
      `
  <div class="form-signin">
    ${alerts.map((a) => alert(a.type, a.msg)).join("")}
    ${authBrand(config, brand)}
    <h3>
      ${title}
    </h3>
    ${renderForm(formModify(form), csrfToken)}
    ${renderAuthLinks(authLinks)}
    ${afterForm}
    <style>
    html,
body {
  height: 100%;
}

body {
  display: -ms-flexbox;
  display: -webkit-box;
  display: flex;
  -ms-flex-align: center;
  -ms-flex-pack: center;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  padding-top: 40px;
  padding-bottom: 40px;
  background-color: #f5f5f5;
}

.form-signin {
  width: 100%;
  max-width: 330px;
  padding: 15px;
  margin: 0 auto;
}
.form-signin .checkbox {
  font-weight: 400;
}
.form-signin .form-control {
  position: relative;
  box-sizing: border-box;
  height: auto;
  padding: 10px;
  font-size: 16px;
}
.form-signin .form-control:focus {
  z-index: 2;
}
.form-signin input[type="email"] {
  margin-bottom: -1px;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}
.form-signin input[type="password"] {
  margin-bottom: 10px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
    </style>
  </div>
  `
    ),
});
const renderAuthLinks = (authLinks) => {
  var links = [];
  if (authLinks.login)
    links.push(link(authLinks.login, "Already have an account? Login!"));
  if (authLinks.forgot) links.push(link(authLinks.forgot, "Forgot password?"));
  if (authLinks.signup)
    links.push(link(authLinks.signup, "Create an account!"));
  const meth_links = (authLinks.methods || [])
    .map(({ url, icon, label }) =>
      a(
        { href: url, class: "btn btn-secondary btn-user btn-block mb-1" },
        icon || "",
        `&nbsp;Login with ${label}`
      )
    )
    .join("");

  return (
    meth_links + links.map((l) => div({ class: "text-center" }, l)).join("")
  );
};

const formModify = (form) => {
  form.formStyle = "vert";
  form.submitButtonClass = "btn-primary btn-user btn-block";
  return form;
};

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "stylesheet",
        form: async () => {
          return new Form({
            fields: [
              {
                name: "in_card",
                label: "Default content in card?",
                type: "Bool",
                required: true,
              },
              {
                name: "colorscheme",
                label: "Navbar color scheme",
                type: "String",
                required: true,
                default: "navbar-light",
                attributes: {
                  options: [
                    { name: "navbar-dark bg-dark", label: "Dark" },
                    { name: "navbar-dark bg-primary", label: "Dark Primary" },
                    {
                      name: "navbar-dark bg-secondary",
                      label: "Dark Secondary",
                    },
                    { name: "navbar-light bg-light", label: "Light" },
                    { name: "navbar-light bg-white", label: "White" },
                    { name: "navbar-light", label: "Transparent Light" },
                  ],
                },
              },
              {
                name: "fixedTop",
                label: "Navbar Fixed Top",
                type: "Bool",
                required: true,
              },
              {
                name: "backgroundColor",
                label: "Background Color",
                type: "Color",
                default: "#ffffff",
                required: true,
              },
            ],
          });
        },
      },
    ],
  });

//every saltcorn module has this
module.exports = {
  sc_plugin_api_version: 1,
  layout, //main function we are exporting
  configuration_workflow,
  plugin_name: "metronic-theme",
};



        