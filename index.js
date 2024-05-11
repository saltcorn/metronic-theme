const {
  div,
  text,
  a,
  p,
  h3,
  h2,
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
  button,
  form,
  input,
} = require("@saltcorn/markup/tags");
const {
  navbar,
  navbarSolidOnScroll,
} = require("@saltcorn/markup/layout_utils");
const renderLayout = require("@saltcorn/markup/layout");
const Field = require("@saltcorn/data/models/field");
const Table = require("@saltcorn/data/models/table");
const Form = require("@saltcorn/data/models/form");
const File = require("@saltcorn/data/models/file");
const View = require("@saltcorn/data/models/view");
const db = require("@saltcorn/data/db");
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

const hints = {
  cardTitleHeader: 2,
  cardClass: "card-flush",
  cardTitleWrapDiv: true,
  tabClass: "nav-line-tabs mb-3",
  searchBar: {
    inputClass: "ps-13",
    iconButton: false,
    containerClass: "d-flex align-items-center position-relative w-100 m-0",
    iconClass:
      "fs-3 text-gray-500 position-absolute top-50 ms-5 translate-middle-y",
  },
};
const isNode = typeof window === "undefined";

/**
 * omit '/' in a mobile deployment (needed for ios)
 */
const safeSlash = () => (isNode ? "/" : "");

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
              ``,
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

const renderBody = (title, body, alerts, config, role, req) =>
  renderLayout({
    blockDispatch: blockDispatch(config),
    role,
    layout:
      typeof body === "string" && config.in_card
        ? { type: "card", title, contents: body }
        : body,
    alerts,
    hints,
    req,
  });

const brandLogo = (stylesheet, brand) =>
  a(
    {
      href: "/",
    },
    brand?.logo &&
      img({
        src: brand.logo,
        class: "h-40px",
        alt: "Logo",
      }),
    brand &&
      (stylesheet.brandHasLabel || !brand.logo) &&
      h2({ class: "logo" }, brand.name)
  );

const sidebar = (brand, sections, currentUrl, stylesheet) =>
  div(
    {
      id: "kt_aside",
      ...stylesheet.attributes.kt_aside,
    },
    !stylesheet.shallowSecondaryHeader &&
      div(
        {
          ...stylesheet.attributes.kt_aside_logo,
          id: "kt_aside_logo",
        },
        brandLogo(stylesheet, brand)
      ),
    div(
      {
        ...stylesheet.attributes.kt_aside_menu,
        id: "kt_aside_menu",
      },
      div(
        {
          id: "kt_aside_menu_wrapper",
          ...stylesheet.attributes.kt_aside_menu_wrapper,
        },
        div(
          {
            id: "kt_aside_menu1",
            ...stylesheet.attributes.kt_aside_menu1,
          },
          sections.map(sideBarSection(currentUrl, stylesheet))
        )
      )
    )
    /*div(
      {
        class: "aside-footer flex-column-auto pb-5 pb-lg-10",
        id: "kt_aside_footer",
      },
      div({
        class: "d-flex flex-center w-100 scroll-px",
        "data-bs-toggle": "tooltip",
        "data-bs-placement": "right",
        "data-bs-dismiss": "click",
        title: "Quick actions",
      })
    )*/
  );
const sideBarSection = (currentUrl, stylesheet) => (section) =>
  section.items.map(sideBarItem(currentUrl, stylesheet)).join("");

const sideBarItem = (currentUrl, stylesheet) => (item) => {
  const is_active = active(currentUrl, item);
  return div(
    {
      "data-kt-menu-trigger": item.subitems
        ? stylesheet.menuItemTrigger
        : undefined,
      ...stylesheet.attributes.menu_item,
      class: [
        "menu-item",
        stylesheet.menuItemClass,
        item.subitems && is_active && "show here",
        !item.subitems && is_active && "active",
        // item.isUser && "aside-footer flex-column-auto px-6 px-lg-9",
      ],
    },

    item.link
      ? a(
          {
            class: [
              "menu-link",
              stylesheet.menuLinkClass,

              is_active && "active",
            ],
            href: text(item.link),
            target: item.target_blank ? "_blank" : undefined,
          },
          item.icon
            ? span({ class: "menu-icon" }, i({ class: `fs-2 ${item.icon}` }))
            : "",

          stylesheet.menuHasLabel &&
            span({ class: "menu-title" }, text(item.label))
        )
      : item.subitems
      ? [
          span(
            { class: ["menu-link", stylesheet.menuLinkClass] },
            item.icon
              ? span(
                  { class: "menu-icon me-0" },
                  i(
                    { class: `fs-2 ${item.icon}` }
                    //span({ class: "path1" }),
                    //span({ class: "path2" })
                  )
                )
              : "",
            stylesheet.menuHasLabel &&
              span({ class: "menu-title" }, text(item.label)),
            stylesheet.menuHasArrow && span({ class: "menu-arrow" })
          ),
          div(
            {
              class: ["menu-sub", stylesheet.menuSubClass],
            },

            item.subitems.map(subItem(currentUrl))
          ),
        ]
      : span({ class: "menu-link" }, text(item.label))
  );
};

const subItem = (currentUrl) => (item) =>
  div(
    {
      class: "menu-item",
    },
    item.link
      ? a(
          {
            class: [
              "menu-link",
              active(currentUrl, item) && "active",
              item.class,
            ],
            target: item.target_blank ? "_blank" : undefined,
            href: text(item.link),
          },
          item.icon
            ? i({ class: `menu-icon ${item.icon}` })
            : i({ class: "far fa-circle nav-icon" }),
          span({ class: "menu-title" }, item.label)
        )
      : a(
          {
            class: ["menu-link"],
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

const wrapIt = (
  config,
  bodyAttr,
  headers,
  title,
  body,
  stylesheet
) => `<!doctype html>
<html lang="en" ${stylesheet?.htmlAttrs || ""}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <!-- Font -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700">
    <!-- Vendor Stylesheets -->
		<!--Global Stylesheets Bundle-->
		<link href="${safeSlash()}plugins/public/metronic-theme${verstring}/${
  config.stylesheet || "demo9"
}/assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
		<link href="${
      config.alt_css_file
        ? isNode
          ? `/files/serve/${config.alt_css_file}`
          : `plugins/public/metronic-theme${verstring}/${config.alt_css_file}`
        : `/plugins/public/metronic-theme${verstring}/${
            config.stylesheet || "demo9"
          }/assets/css/style.bundle.css`
    }" rel="stylesheet" type="text/css" />
    <!-- Google Fonts -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap">
    
    ${headersInHead(headers)}    
    <title>${text(title)}</title>
    <style>h2.logo { color: var(--bs-gray-700); display: inline;margin-left: 10px}</style>
  
  </head>

  <body ${bodyAttr}>
    ${body}
    <!-- Change script tags-->
    <script src="${safeSlash()}static_assets/${
      db.connectObj.version_tag
    }/jquery-3.6.0.min.js"></script>
    <script type="text/javascript" src="https://unpkg.com/@popperjs/core@2.11.8/dist/umd/popper.min.js"></script>
    <script src="${safeSlash()}plugins/public/metronic-theme${verstring}/bootstrap.bundle.min.js"></script>

    <script src="${safeSlash()}plugins/public/metronic-theme${verstring}/${
  config.stylesheet || "demo9"
}/assets/js/scripts.bundle.js"></script>

    ${headersInBody(headers)}
  </body>

</html>`;

const authBrand = (config, { name, logo }) =>
  logo
    ? `<img class="mb-4" src="${logo}" alt="Logo" width="72" height="72">`
    : "";

const secondaryMenuHeader = (
  menuSections,
  stylesheet,
  brand,
  hasNotifications,
  config,
  user,
  title
) => {
  const menuItems = menuSections.map((s) => s.items).flat();
  const menuItemsNoUser = menuItems.filter((item) => !item.isUser);
  const userMenuItem = menuItems.find((item) => item.isUser);
  const brandMarkup =
    !!brand &&
    a(
      {
        href: isNode ? "/" : "javascript:execLink('/')",
        class: stylesheet.shallowSecondaryHeader ? false : "d-lg-none",
      },
      brand.logo &&
        img({
          src: brand.logo,
          class: "h-40px",
          alt: "Logo",
        }),
      (stylesheet.brandHasLabel || !brand.logo) &&
        h2({ class: "logo" }, brand.name)
    );
  const mkMenuItem = (item) =>
    item.type === "Search"
      ? form(
          {
            action: "/search",
            class: "menusearch mt-4",
            method: "get",
          },
          i({
            style: { top: "35px" },
            class:
              "fas fa-search fs-2 text-gray-500 position-absolute translate-middle-y ms-0",
          }),

          input({
            type: "search",
            class:
              "search-input  form-control form-control-flush ps-10 search-bar hasbl",
            style: { borderBottom: "1px solid gray" },
            placeholder: item.label,
            id: "inputq",
            name: "q",
            "aria-label": "Search",
            "aria-describedby": "button-search-submit",
          })
        )
      : div(
          {
            //"data-kt-menu-trigger": "{default: 'click', lg: 'hover'}",
            "data-kt-menu-placement": "bottom-start",
            class:
              "menu-item here menu-here-bg menu-lg-down-accordion me-0 me-lg-2 mt-2",
          },
          a(
            { href: item.link, class: "menu-link" },
            span(
              { class: "menu-link py-3" },
              span({ class: "menu-title" }, item.label)
            )
          )
        );
  const headerMarkup = div(
    {
      class: [
        stylesheet.shallowSecondaryHeader
          ? "container-xxl  py-6 py-lg-0 d-flex flex-column flex-lg-row align-items-lg-stretch justify-content-lg-between mt-1"
          : "d-flex align-items-stretch justify-content-between flex-lg-grow-1",
      ],
    },
    config.page_title_header &&
      div(
        { class: "page-title d-flex justify-content-center flex-column me-5" },
        h1(
          { class: "d-flex flex-column text-gray-900 fw-bold fs-3 mb-0" },
          title
        )
      ),
    div(
      { class: "d-flex align-items-stretch", id: "kt_header_nav" },
      div(
        stylesheet.shallowSecondaryHeader
          ? { class: "header-menu align-items-stretch" }
          : {
              class: "header-menu align-items-stretch",
              "data-kt-drawer": "true",
              "data-kt-drawer-name": "header-menu",
              "data-kt-drawer-activate": "{default: true, lg: false}",
              "data-kt-drawer-overlay": "true",
              "data-kt-drawer-width": "{default:'200px', '300px': '250px'}",
              "data-kt-drawer-direction": "end",
              "data-kt-drawer-toggle": "#kt_header_menu_mobile_toggle",
              "data-kt-swapper": "true",
              "data-kt-swapper-mode": "prepend",
              "data-kt-swapper-parent":
                "{default: '#kt_body', lg: '#kt_header_nav'}",
              style: "",
            },
        div(
          {
            class:
              "menu menu-rounded menu-column menu-lg-row menu-active-bg menu-state-primary menu-title-gray-700 menu-arrow-gray-500 fw-semibold my-5 my-lg-0 px-2 px-lg-0 align-items-stretch",
            id: "#kt_header_menu",
            "data-kt-menu": "true",
          },
          menuItemsNoUser.map(mkMenuItem)
        )
      )
    ),
    div(
      { class: "d-flex align-items-stretch flex-shrink-0" },

      hasNotifications &&
        div(
          { class: "d-flex align-items-stretch ms-1 ms-lg-3 mt-4" },
          div(
            {
              //"data-kt-menu-trigger": "{default: 'click', lg: 'hover'}",
              "data-kt-menu-placement": "bottom-start",
              class:
                "menu-item here menu-here-bg menu-lg-down-accordion me-0 me-lg-2",
            },
            a(
              { href: "/notifications", class: "menu-link" },
              span({ class: "menu-icon" }, i({ class: `fs-2 fa fa-bell` }))
            )
          )
        ),
      userMenuItem &&
        div(
          { class: "app-navbar-item", id: "kt_header_user_menu_toggle" },
          div(
            {
              class: "mt-4 me-5 cursor-pointer symbol symbol-40px",
              "data-kt-menu-trigger": "{default: 'click', lg: 'hover'}",
              "data-kt-menu-attach": "parent",
              "data-kt-menu-placement": "bottom-end",
            },
            config.avatar_file && user?.[config.avatar_file]
              ? img({
                  src: `/files/resize/40/40/${user?.[config.avatar_file]}`,
                  height: 40,
                  width: 40,
                })
              : user?.email
              ? div(
                  {
                    class: "h3",
                    style:
                      "border-radius: 50%; background-color: #d5d5d5; width: 40px; height:40px; display: flex;align-items: center; justify-content: center;",
                  },
                  user.email[0].toUpperCase()
                )
              : i({ class: `fs-2 fa fa-user mt-3` })
          ),
          div(
            {
              class:
                "menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg menu-state-color fw-semibold py-4 fs-6 w-275px",
              "data-kt-menu": "true",
              style: "",
            },
            (userMenuItem?.subitems || []).map((si) =>
              div(
                { class: "menu-item px-5" },
                si.link
                  ? a(
                      {
                        href: si.link,
                        class: ["menu-link px-3", si.class],
                      },
                      si.icon && i({ class: [si.icon, "me-2"] }),
                      si.label
                    )
                  : span({ class: ["px-5", si.class] }, si.label)
              )
            )
          )
        ),
      false &&
        div(
          { class: "d-flex align-items-center ms-1 ms-lg-3" },
          div(
            {
              //"data-kt-menu-trigger": "{default: 'click', lg: 'hover'}",
              "data-kt-menu-placement": "bottom-start",
              class:
                "menu-item here menu-here-bg menu-lg-down-accordion me-0 me-lg-2",
            },
            a(
              { href: "/auth/settings", class: "menu-link" },
              span(
                { class: "menu-icon" },
                config.avatar_file && user?.[config.avatar_file]
                  ? img({
                      src: `/files/resize/40/40/${user?.[config.avatar_file]}`,
                      height: 40,
                      width: 40,
                    })
                  : i({ class: `fs-2 fa fa-user` })
              )
            )
          )
        )
    )
  );

  return div(
    { id: "kt_header", style: "", class: "header align-items-stretch" },
    stylesheet.shallowSecondaryHeader
      ? [
          div(
            { class: "header-brand" },
            brandMarkup,
            div(
              {
                id: "kt_aside_toggle",
                class:
                  "btn btn-icon w-auto px-0 btn-active-color-primary aside-minimize",
                "data-kt-toggle": "true",
                "data-kt-toggle-state": "active",
                "data-kt-toggle-target": "body",
                "data-kt-toggle-name": "aside-minimize",
              },
              i(
                {
                  class:
                    "ki-duotone ki-entrance-right fs-1 me-n1 minimize-default",
                },
                span({ class: "path1" }),
                span({ class: "path2" })
              ),
              i(
                { class: "ki-duotone ki-entrance-left fs-1 minimize-active" },
                span({ class: "path1" }),
                span({ class: "path2" })
              )
            ),
            div(
              {
                class: "d-flex align-items-center d-lg-none me-n2",
                title: "Show aside menu",
              },
              div(
                {
                  class: "btn btn-icon btn-active-color-primary w-30px h-30px",
                  id: "kt_aside_mobile_toggle",
                },
                i(
                  { class: "ki-duotone ki-abstract-14 fs-1" },
                  span({ class: "path1" }),
                  span({ class: "path2" })
                )
              )
            )
          ),
          div({ class: "toolbar d-flex align-items-stretch" }, headerMarkup),
        ]
      : div(
          {
            class:
              "container-fluid d-flex align-items-stretch justify-content-between",
          },
          div(
            {
              class: "d-flex align-items-center d-lg-none ms-n1 me-2",
              title: "Show aside menu",
            },
            div(
              {
                class:
                  "btn btn-icon btn-active-color-primary w-30px h-30px w-md-40px h-md-40px",
                id: "kt_aside_mobile_toggle",
              },
              i({ class: "ki-outline ki-abstract-14 fs-1" })
            )
          ),
          div(
            { class: "d-flex align-items-center flex-grow-1 flex-lg-grow-0" },
            brandMarkup
          ),
          headerMarkup
        )
  );
};
const mobileHeader = (stylesheet, brand) =>
  div(
    { class: "header-mobile py-3" },
    div(
      { class: "container d-flex flex-stack" },
      div(
        { class: "d-flex align-items-center flex-grow-1 flex-lg-grow-0" },
        brandLogo(stylesheet, brand)
      ),
      button(
        {
          class: "btn btn-icon btn-active-color-primary me-n4",
          id: "kt_aside_toggle",
        },
        i(
          { class: "ki-duotone ki-abstract-14 fs-2x" },
          span({ class: "path1" }),
          span({ class: "path2" })
        )
      )
    )
  );

const splitPrimarySecondaryMenu = (menu) => {
  return {
    primary: (menu || [])
      .map((mi) => ({
        ...mi,
        items: mi.items.filter(
          (item) => item.location !== "Secondary Menu" && mi.section !== "User"
        ),
      }))
      .filter(({ items }) => items.length),
    secondary: (menu || [])
      .map((mi) => ({
        ...mi,
        items: mi.items.filter(
          (item) => item.location === "Secondary Menu" || mi.section === "User"
        ),
      }))
      .filter(({ items }) => items.length),
  };
};
const layout = (config) => ({
  hints,
  wrap: ({
    title,
    menu,
    brand,
    alerts,
    currentUrl,
    body,
    headers,
    role,
    req,
  }) => {
    const stylesheet = getStylesheet(config);
    //console.log(menu[1]);

    const { primary, secondary } = splitPrimarySecondaryMenu(menu);

    //console.log(headerItems);
    const hasNotifications = menu
      ?.find((section) => section.isUser)
      ?.items?.[0]?.subitems?.find?.((item) => item.link === "/notifications");
    //console.log("userItem", hasNotifications);
    const header = !(brand || menu)
      ? ""
      : config.secondary_menu_header
      ? secondaryMenuHeader(
          secondary,
          stylesheet,
          brand,
          hasNotifications,
          config,
          req?.user,
          title
        )
      : mobileHeader(stylesheet, brand);
    return wrapIt(
      config,
      `id="kt_body" class="${stylesheet.bodyClass}" ${
        stylesheet.bodyAttrs || ""
      }`,
      headers,
      title,
      //this represents the body
      `
    <div class="d-flex flex-column flex-root">
      <div class="page d-flex flex-row flex-column-fluid">
        <!-- call the sidebar here-->
        ${brand || menu ? sidebar(brand, primary, currentUrl, stylesheet) : ""}
        <div class="wrapper d-flex flex-column flex-row-fluid" id="kt_wrapper">
          ${header}
          <div class="content d-flex flex-column flex-column-fluid" id="kt_content" style="margin-top:0px">
            <div class="container-xxl" id="kt_content_container">
                <div id="page-inner-content">
                  ${renderBody(title, body, alerts, config, role, req)}
                </div>
            </div>
          </div>
        </div>
      </div>    
    </div>
    `,
      stylesheet
    );
  },
  renderBody: ({ title, body, alerts, role, req }) =>
    renderBody(title, body, alerts, config, role, req),
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

// see titles here https://preview.keenthemes.com/metronic8
const stylesheets = require("./stylesheets.json");

const getStylesheet = (config) => stylesheets[config.stylesheet || "demo9"];

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "stylesheet",
        form: async () => {
          const userFields = Table.findOne("users").fields;
          const cssfiles = await File.find({
            mime_super: "text",
            mime_sub: "css",
          });
          return new Form({
            blurb:
              'Note that this is a Commercial theme, and requires a License from <a href="https://keenthemes.com/metronic">KeenThemes</a> ',
            fields: [
              {
                name: "purchase_code",
                label: "Purchase code",
                type: "String",
                required: true,
              },
              {
                name: "stylesheet",
                label: "Stylesheet",
                type: "String",
                required: true,
                default: "navbar-light",
                attributes: {
                  options: Object.values(stylesheets).map(
                    ({ name, label }) => ({
                      name,
                      label,
                    })
                  ),
                },
              },
              {
                name: "alt_css_file",
                label: "Alternative CSS file",
                sublabel: "Use this CSS stylesheet file instead",
                type: "String",
                attributes: {
                  options: cssfiles.map((fl) => ({
                    label: fl.filename,
                    name: fl.path_to_serve,
                  })),
                },
              },
              {
                name: "secondary_menu_header",
                label: "Secondary menu header",
                type: "Bool",
              },
              {
                name: "page_title_header",
                label: "Page title in header",
                type: "Bool",
                showIf: { secondary_menu_header: true },
              },
              {
                name: "avatar_file",
                label: "Avatar field",
                type: "String",
                attributes: {
                  options: userFields.filter((f) => f.type === "File"),
                },
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
  fonts: (config) => ({ Inter: "Inter, sans-serif" }),
};
