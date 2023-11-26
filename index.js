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
  div(
    {
      id: "kt_aside",
      class: "aside ",
      "data-kt-drawer": "true",
      "data-kt-drawer-name": "aside",
      "data-kt-drawer-activate": "{default: true, lg: false}",
      "data-kt-drawer-overlay": "true",
      "data-kt-drawer-width": "auto",
      "data-kt-drawer-direction": "start",
      "data-kt-drawer-toggle": "#kt_aside_toggle",
    },
    div(
      {
        class: "aside-logo flex-column-auto pt-10 pt-lg-20",
        id: "kt_aside_logo",
      },
      a(
        {
          href: "/",
        },
        brand.logo &&
          img({
            src: brand.logo,
            width: "30",
            height: "30",
            class: "h-40px",
            alt: "Logo",
            loading: "lazy",
          }),
        h2({ class: "logo" }, brand.name)
      )
    ),
    div(
      {
        class: "aside-menu flex-column-fluid pt-0 pb-7 py-lg-10",
        id: "kt_aside_menu",
      },
      div(
        {
          id: "kt_aside_menu_wrapper",
          class: "w-100 hover-scroll-y scroll-lg-ms d-flex",
          "data-kt-scroll": "true",
          "data-kt-scroll-activate": "{default: false, lg: trur}",
          "data-kt-scroll-height": "auto",
          "data-kt-scroll-dependencies": "#kt_aside_logo, #kt_aside_footer",
          "data-kt-scroll-wrappers": "#kt_aside, #kt_aside_menu",
          "data-kt-scroll-offset": "0",
        },
        div(
          {
            id: "kt_aside_menu",
            class:
              "menu menu-column menu-title-gray-600 menu-state-primary menu-state-icon-primary menu-state-bullet-primary menu-icon-gray-500 menu-arrow-gray-500 fw-semibold fs-6 my-auto",
            "data-kt-menu": "true",
          },
          sections.map(sideBarSection(currentUrl))
        )
      )
    ),
    div(
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
    )
  );
const sideBarSection = (currentUrl) => (section) =>
  section.items.map(sideBarItem(currentUrl)).join("");

const sideBarItem = (currentUrl) => (item) => {
  const is_active = active(currentUrl, item);
  return div(
    {
      "data-kt-menu-trigger": item.subitems
        ? "{default: 'click', lg: 'hover'}"
        : undefined,
      "data-kt-enu-placement": "right-start",
      class: [
        "menu-item show py-2",
        item.subitems && is_active && "show here",
        !item.subitems && is_active && "active",
        item.isUser && "aside-footer flex-column-auto px-6 px-lg-9",
      ],
    },

    item.link
      ? a(
          {
            class: ["menu-link menu-center", is_active && "active"],
            href: text(item.link),
            target: item.target_blank ? "_blank" : undefined,
          },
          item.icon
            ? span({ class: "menu-icon" }, i({ class: `fs-2 ${item.icon}` }))
            : ""

          //span({ class: "menu-title" }, text(item.label))
        )
      : item.subitems
      ? [
          span(
            { class: "menu-link menu-center" },
            item.icon
              ? span(
                  { class: "menu-icon me-0" },
                  i(
                    { class: `fs-2 ${item.icon}` },
                    span({ class: "path1" }),
                    span({ class: "path2" })
                  )
                )
              : ""
          ),
          div(
            {
              class:
                "menu-sub menu-sub-dropdown px-2 py-4 w-250px mh-75 overflow-auto",
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

const wrapIt = (config, bodyAttr, headers, title, body) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <!-- Font -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700">
    <!-- Vendor Stylesheets -->
		<!--Global Stylesheets Bundle-->
		<link href="/plugins/public/metronic-theme${verstring}/${
  config.stylesheet || "demo9"
}/assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
		<link href="/plugins/public/metronic-theme${verstring}/${
  config.stylesheet || "demo9"
}/assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
    <!-- Google Fonts -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap">
    
    ${headersInHead(headers)}    
    <title>${text(title)}</title>
    <style>h2.logo { color: var(--bs-gray-700); display: inline;margin-left: 10px}</style>
  
  </head>

  <body ${bodyAttr}>
    ${body}
    <!-- Change script tags-->
    <script src="/static_assets/${
      db.connectObj.version_tag
    }/jquery-3.6.0.min.js"></script>
    <script type="text/javascript" src="https://unpkg.com/@popperjs/core@2.11.8/dist/umd/popper.min.js"></script>
    <script src="/plugins/public/metronic-theme${verstring}/bootstrap.bundle.min.js"></script>

    <script src="/plugins/public/metronic-theme${verstring}/${
  config.stylesheet || "demo9"
}/assets/js/scripts.bundle.js"></script>

    ${headersInBody(headers)}
  </body>

</html>`;

const authBrand = (config, { name, logo }) =>
  logo
    ? `<img class="mb-4" src="${logo}" alt="Logo" width="72" height="72">`
    : "";

const layout = (config) => ({
  wrap: ({ title, menu, brand, alerts, currentUrl, body, headers, role }) => {
    const stylesheet = getStylesheet(config);
    return wrapIt(
      config,
      `id="kt_body" class="${stylesheet.bodyClass}"`,
      headers,
      title,
      //this represents the body
      `
    <div class="d-flex flex-column flex-root">
      <div class="page d-flex flex-row flex-column-fluid">
        <!-- call the sidebar here-->
        ${sidebar(brand, menu, currentUrl)}
        <div class="wrapper d-flex flex-column flex-row-fluid" id="kt_wrapper">
          <div class="header-mobile py-3">
            <div class="container d-flex flex-stack">
                  <div class="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
                    <a 
                      brand.logo &&
                      <img class: "h-40px">
                        <h2 class="logo">
                          TRITAC
                        </h2>
                      </img>
                    </a>
                  </div>
                  <button class="btn btn-icon btn-active-color-primary me-n4" id="kt_aside_toggle">
                    <i class="ki-duotone ki-abstract-14 fs-2x"><span class="path1"></span><span class="path2"></span></i>
                  </button>
            </div>
          </div>
          <div class="content d-flex flex-column flex-column-fluid" id="kt_content">
            <div class="container-xxl" id="kt_content_container">
                <div id="page-inner-content">
                  ${renderBody(title, body, alerts, config, role)}
                </div>
            </div>
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

// see titles here https://preview.keenthemes.com/metronic8
const stylesheets = require("./stylesheets.json");

const getStylesheet = (config) => stylesheets[config.stylesheet || "demo9"];

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
                name: "stylesheet",
                label: "Stylesheet",
                type: "String",
                required: true,
                default: "navbar-light",
                attributes: {
                  options: stylesheets.map(({ name, label }) => ({
                    name,
                    label,
                  })),
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
};