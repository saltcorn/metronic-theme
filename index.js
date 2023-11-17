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
      class: "aside pt-7 pb-4 pb-lg-7 pt-lg-17",
      //"data-kt-drawer": "true",
      "data-kt-drawer-name": "aside",
      "data-kt-drawer-activate": "{default: true, lg: false}",
      "data-kt-drawer-overlay": "true",
      "data-kt-drawer-width": "{default:'200px', '300px': '250px'}",
      "data-kt-drawer-direction": "start",
      "data-kt-drawer-toggle": "#kt_aside_toggle",
    },
    div(
      {
        class: "aside-logo flex-column-auto px-9 mb-9 mb-lg-17 mx-auto",
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
            class: "h-30px logo theme-light-show",
            alt: "Logo",
            loading: "lazy",
          }),
        span({ class: "logo" }, brand.name)
      )
    ),
    div(
      {
        class: "aside-menu flex-column-fluid ps-3 ps-lg-5 pe-1 mb-9",
        id: "kt_aside_menu",
      },
      div(
        {
          class: "w-100 hover-scroll-y pe-2 me-2",
          id: "kt_aside_menu_wrapper",
          "data-kt-scroll": "true",
          "data-kt-scroll-activate": "{default: false, lg: true}",
          "data-kt-scroll-height": "auto",
          "data-kt-scroll-dependencies":
            "#kt_aside_logo, #kt_aside_user, #kt_aside_footer",
          "data-kt-scroll-wrappers":
            "#kt_aside, #kt_aside_menu, #kt_aside_menu_wrapper",
          "data-kt-scroll-offset": "0",
          style: "height: 810px;",
        },

        div(
          {
            class:
              "menu menu-column menu-rounded menu-sub-indention fw-semibold",
            id: "#kt_aside_menu",
            "data-kt-menu": "true",
          },
          sections.map(sideBarSection(currentUrl))
        )
      )
    )
  );
const sideBarSection = (currentUrl) => (section) =>
  section.items.map(sideBarItem(currentUrl)).join("");

const sideBarItem = (currentUrl) => (item) => {
  const is_active = active(currentUrl, item);
  return div(
    {
      "data-kt-menu-trigger": item.subitems ? "click" : undefined,
      class: [
        "menu-item menu-accordion",
        item.subitems && is_active && "menu-open",
        item.isUser && "aside-footer flex-column-auto px-6 px-lg-9",
      ],
    },
    //change subitems to match html structure from metronic so that the right styles and classes are applied
    //only consider 2 levels of submenu, not 3 like in metronic
    item.link
      ? a(
          {
            class: ["menu-link", is_active && "active"],
            href: text(item.link),
            target: item.target_blank ? "_blank" : undefined,
          },
          item.icon
            ? span({ class: "menu-icon" }, i({ class: `fs-2 ${item.icon}` }))
            : "",

          span({ class: "menu-title" }, text(item.label))
        )
      : item.subitems
      ? [
          span(
            { class: "menu-link" },
            item.icon
              ? span({ class: "menu-icon" }, i({ class: `fs-2 ${item.icon}` }))
              : "",
            span({ class: "menu-title" }, text(item.label)),
            span({ class: "menu-arrow" })
          ),
          div(
            { class: "menu-sub menu-sub-accordion" },

            item.subitems.map(subItem(currentUrl))
          ),
        ]
      : span({ class: "menu-link" }, text(item.label))
  );
};

const subItem = (currentUrl) => (item) =>
  div(
    { class: "menu-item" },
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
          p(item.label)
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
		<link href="/plugins/public/metronic-theme${verstring}/assets/plugins/custom/datatables/datatables.bundle.css" rel="stylesheet" type="text/css" />
		<!--Global Stylesheets Bundle-->
		<link href="/plugins/public/metronic-theme${verstring}/assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
		<link href="/plugins/public/metronic-theme${verstring}/assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
    <!-- Google Fonts -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap">
    
    ${headersInHead(headers)}    
    <title>${text(title)}</title>
  </head>

  <body ${bodyAttr}>
    ${body}
    <!-- Change script tags-->
    <script src="/static_assets/${
      db.connectObj.version_tag
    }/jquery-3.6.0.min.js"></script>
    <script src="/plugins/public/metronic-theme${verstring}/bootstrap.bundle.min.js"></script>

    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.4/umd/popper.min.js"></script>

    <script src="/plugins/public/metronic-theme${verstring}/assets/js/scripts.bundle.js"></script>

    ${headersInBody(headers)}
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
      //this represents the body
      `
    <div class="d-flex flex-column flex-root">
      <div class="page d-flex flex-row flex-column-fluid">
        <!-- call the sidebar here-->
        ${sidebar(brand, menu, currentUrl)}
        <div class="wrapper d-flex flex-column flex-row-fluid" id="kt_wrapper">
          <div id="page-inner-content">
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
