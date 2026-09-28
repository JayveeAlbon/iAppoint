"""
Generates the iAppoint Installation & Developer Guide PDF.
Run:  python build_installation_guide.py
Output: iAppoint_Installation_Guide.pdf
"""

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    ListFlowable, ListItem, KeepTogether
)
from reportlab.pdfgen import canvas

# ---------- Colors (school-ish palette) ----------
PRIMARY   = HexColor("#0F3B7A")   # deep blue
ACCENT    = HexColor("#F5A623")   # warm gold
SOFT_BG   = HexColor("#EEF2F8")
CODE_BG   = HexColor("#1E1E2E")
CODE_FG   = HexColor("#E4E4E7")
MUTED     = HexColor("#4B5563")
DIVIDER   = HexColor("#D1D5DB")

# ---------- Styles ----------
styles = getSampleStyleSheet()

TITLE = ParagraphStyle(
    "TitleBig", parent=styles["Title"],
    fontName="Helvetica-Bold", fontSize=32, leading=38,
    textColor=PRIMARY, alignment=TA_CENTER, spaceAfter=6,
)
SUBTITLE = ParagraphStyle(
    "SubTitle", parent=styles["Normal"],
    fontName="Helvetica", fontSize=14, leading=18,
    textColor=MUTED, alignment=TA_CENTER, spaceAfter=24,
)
H1 = ParagraphStyle(
    "H1", parent=styles["Heading1"],
    fontName="Helvetica-Bold", fontSize=20, leading=26,
    textColor=PRIMARY, spaceBefore=14, spaceAfter=10,
)
H2 = ParagraphStyle(
    "H2", parent=styles["Heading2"],
    fontName="Helvetica-Bold", fontSize=15, leading=20,
    textColor=PRIMARY, spaceBefore=12, spaceAfter=6,
)
H3 = ParagraphStyle(
    "H3", parent=styles["Heading3"],
    fontName="Helvetica-Bold", fontSize=12, leading=16,
    textColor=black, spaceBefore=8, spaceAfter=4,
)
BODY = ParagraphStyle(
    "Body", parent=styles["BodyText"],
    fontName="Helvetica", fontSize=11, leading=16,
    textColor=black, alignment=TA_JUSTIFY, spaceAfter=6,
)
BODY_L = ParagraphStyle(
    "BodyLeft", parent=BODY, alignment=TA_LEFT,
)
CALLOUT = ParagraphStyle(
    "Callout", parent=BODY_L,
    fontName="Helvetica", fontSize=10.5, leading=15,
    textColor=black, spaceAfter=6,
)
CODE = ParagraphStyle(
    "Code", parent=styles["Code"],
    fontName="Courier", fontSize=9.5, leading=13,
    textColor=CODE_FG, backColor=CODE_BG,
    leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=10,
    borderPadding=6,
)
MUTED_SM = ParagraphStyle(
    "MutedSm", parent=BODY_L,
    fontSize=9, textColor=MUTED, leading=12,
)

# ---------- Reusable helpers ----------
def code_block(text):
    """Render a multi-line code block. Escape angle brackets for reportlab."""
    escaped = (
        text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace(" ", "&nbsp;")
            .replace("\n", "<br/>")
    )
    return Paragraph(escaped, CODE)

def bullet_list(items):
    return ListFlowable(
        [ListItem(Paragraph(t, BODY_L), leftIndent=10, value="circle") for t in items],
        bulletType="bullet",
        start="circle",
        leftIndent=14,
        bulletFontSize=8,
        bulletColor=PRIMARY,
    )

def callout_box(title, body_text, bg=SOFT_BG, border=PRIMARY):
    tbl = Table(
        [[Paragraph(f"<b>{title}</b>", CALLOUT)],
         [Paragraph(body_text, CALLOUT)]],
        colWidths=[6.5*inch],
    )
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("BOX", (0,0), (-1,-1), 1, border),
        ("LEFTPADDING", (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("TOPPADDING", (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ]))
    return tbl

def divider():
    t = Table([[""]], colWidths=[6.5*inch], rowHeights=[1])
    t.setStyle(TableStyle([("LINEBELOW", (0,0), (-1,-1), 0.6, DIVIDER)]))
    return t

# ---------- Page numbers / footer / header ----------
def draw_page_chrome(canv, doc):
    canv.saveState()
    # Header band on non-cover pages
    if doc.page > 1:
        canv.setFillColor(PRIMARY)
        canv.rect(0, LETTER[1]-0.55*inch, LETTER[0], 0.55*inch, fill=1, stroke=0)
        canv.setFillColor(white)
        canv.setFont("Helvetica-Bold", 11)
        canv.drawString(0.6*inch, LETTER[1]-0.35*inch, "iAppoint — Installation & Developer Guide")
        canv.setFont("Helvetica", 9)
        canv.drawRightString(LETTER[0]-0.6*inch, LETTER[1]-0.35*inch, "For SCC Faculty Appointment System")

    # Footer
    canv.setFillColor(MUTED)
    canv.setFont("Helvetica", 9)
    canv.drawString(0.6*inch, 0.4*inch, "iAppoint v2 • Prepared for capstone defense")
    canv.drawRightString(LETTER[0]-0.6*inch, 0.4*inch, f"Page {doc.page}")
    # Accent line above footer
    canv.setStrokeColor(ACCENT)
    canv.setLineWidth(1)
    canv.line(0.6*inch, 0.55*inch, LETTER[0]-0.6*inch, 0.55*inch)
    canv.restoreState()


# ---------- Document ----------
OUTPUT = "iAppoint_Installation_Guide.pdf"

doc = SimpleDocTemplate(
    OUTPUT, pagesize=LETTER,
    leftMargin=0.6*inch, rightMargin=0.6*inch,
    topMargin=0.9*inch, bottomMargin=0.7*inch,
    title="iAppoint Installation & Developer Guide",
    author="iAppoint Development Team",
)

story = []

# ================================================================
# COVER PAGE
# ================================================================
story.append(Spacer(1, 1.4*inch))
story.append(Paragraph("iAppoint", TITLE))
story.append(Paragraph("Faculty Appointment &amp; Scheduling System", SUBTITLE))

# Cover art panel
cover_panel = Table(
    [[Paragraph("<b>Installation &amp; Developer Guide</b>", ParagraphStyle(
        "cvr", parent=BODY, fontSize=18, leading=24,
        textColor=white, alignment=TA_CENTER, fontName="Helvetica-Bold"))],
     [Paragraph("A friendly, teacher-style walkthrough of what was installed,<br/>"
                "how the code is organized, and how everything talks to each other.",
                ParagraphStyle("cvr2", parent=BODY, fontSize=12, leading=18,
                               textColor=white, alignment=TA_CENTER))]],
    colWidths=[6*inch]
)
cover_panel.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), PRIMARY),
    ("TOPPADDING", (0,0), (-1,-1), 22),
    ("BOTTOMPADDING", (0,0), (-1,-1), 22),
    ("LEFTPADDING", (0,0), (-1,-1), 20),
    ("RIGHTPADDING", (0,0), (-1,-1), 20),
]))
story.append(cover_panel)
story.append(Spacer(1, 0.35*inch))

meta = Table(
    [
        ["Project", "iAppoint v2"],
        ["Framework", "Laravel 12 + React 18 (Inertia.js)"],
        ["Database", "MySQL 8"],
        ["Prepared for", "Capstone Panel Defense"],
        ["Prepared by", "iAppoint Development Team"],
    ],
    colWidths=[1.7*inch, 4.3*inch]
)
meta.setStyle(TableStyle([
    ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
    ("FONTNAME", (1,0), (1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 11),
    ("TEXTCOLOR", (0,0), (0,-1), PRIMARY),
    ("LINEBELOW", (0,0), (-1,-1), 0.4, DIVIDER),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("TOPPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ("BACKGROUND", (0,0), (-1,-1), SOFT_BG),
]))
story.append(meta)

story.append(PageBreak())

# ================================================================
# WELCOME / HOW TO USE THIS GUIDE
# ================================================================
story.append(Paragraph("Welcome — Read This First", H1))
story.append(Paragraph(
    "Hi! This guide is written like a mini-classroom lesson. If you have never touched "
    "code before, that's totally fine — this document explains iAppoint from the very "
    "beginning: what to install on your computer, what each installed package does, "
    "and how the different parts of the system talk to each other.",
    BODY))
story.append(Paragraph(
    "By the end of this guide, you will be able to explain — in plain English — what "
    "your project does, what technologies power it, and how a request travels from a "
    "user's browser all the way to the database and back. That is exactly the kind of "
    "understanding a panelist wants to hear.",
    BODY))

story.append(Spacer(1, 6))
story.append(callout_box(
    "How to read this guide",
    "Every important word in <b>bold</b> is a term a panelist might ask about. When you see "
    "a dark code box, that is real code taken from your project — you don't need to memorize "
    "it, only understand what it is doing at a high level. Each chapter ends with a short "
    "<i>\"If a panelist asks…\"</i> box so you can rehearse an answer."))

story.append(Spacer(1, 10))
story.append(Paragraph("What is iAppoint?", H2))
story.append(Paragraph(
    "iAppoint is a web-based <b>Faculty Appointment and Scheduling System</b> for a school "
    "(email domain <font face='Courier'>@scc.edu</font>). It lets students find faculty "
    "members, view their schedule, send messages, and request appointments. Faculty can "
    "manage their availability, respond to requests, and show their location on a campus map. "
    "Admins approve accounts, approve appointments, view reports, and check an audit log of "
    "everything that happens in the system.",
    BODY))

story.append(Paragraph("The three types of users", H3))
story.append(bullet_list([
    "<b>Student</b> — books appointments with faculty and chats with friends.",
    "<b>Faculty</b> — sets a weekly schedule, shares availability, and approves/rejects meetings.",
    "<b>Admin</b> — approves new accounts, approves appointments, views reports and audit logs.",
]))

story.append(PageBreak())

# ================================================================
# TABLE OF CONTENTS
# ================================================================
story.append(Paragraph("Table of Contents", H1))
toc_rows = [
    ["1", "System Requirements — What Your Computer Needs"],
    ["2", "Step-by-Step Installation"],
    ["3", "Running the Project (Daily Use)"],
    ["4", "The Tech Stack — What Was Installed and Why"],
    ["5", "How Laravel Works — The Big Picture"],
    ["6", "Routes — The Front Door of the App"],
    ["7", "Controllers — The Brain of Each Page"],
    ["8", "Models — Talking to the Database"],
    ["9", "Migrations — Building the Database"],
    ["10", "Backend vs. Frontend — Who Does What?"],
    ["11", "Login Accounts (Seeded Data)"],
    ["12", "Troubleshooting Common Errors"],
    ["13", "Panelist Q&A Cheat Sheet"],
]
toc = Table(toc_rows, colWidths=[0.5*inch, 5.9*inch])
toc.setStyle(TableStyle([
    ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
    ("TEXTCOLOR", (0,0), (0,-1), ACCENT),
    ("FONTSIZE", (0,0), (-1,-1), 11.5),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ("LINEBELOW", (0,0), (-1,-1), 0.3, DIVIDER),
]))
story.append(toc)
story.append(PageBreak())

# ================================================================
# CHAPTER 1 — REQUIREMENTS
# ================================================================
story.append(Paragraph("1. System Requirements — What Your Computer Needs", H1))
story.append(Paragraph(
    "Before you install iAppoint, three tools must already exist on your computer. "
    "Think of them as the <b>engines</b> that will run your project. If any of them is "
    "missing, the project will refuse to start.",
    BODY))

reqs = [
    ["Tool", "Version", "Why it's needed"],
    ["PHP", "8.2 or higher",
     "The language Laravel is written in. It runs the backend (the 'brain' of the site)."],
    ["Composer", "2.x",
     "PHP's package manager. It downloads all the PHP libraries your project depends on."],
    ["Node.js + npm", "Node 18+",
     "Runs JavaScript on your computer. Needed to build the React frontend."],
    ["MySQL", "8.x",
     "The database that stores users, appointments, schedules, and messages."],
    ["Git (optional)", "any",
     "Used to download the project from a code repository like GitHub."],
    ["A code editor", "VS Code recommended",
     "So you can open and read the project files comfortably."],
]
req_tbl = Table(reqs, colWidths=[1.3*inch, 1.3*inch, 3.8*inch])
req_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 10.5),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("RIGHTPADDING", (0,0), (-1,-1), 8),
    ("TOPPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, SOFT_BG]),
    ("GRID", (0,0), (-1,-1), 0.3, DIVIDER),
]))
story.append(req_tbl)

story.append(Spacer(1, 8))
story.append(callout_box(
    "Easiest way to get all of this on Windows",
    "Install <b>XAMPP</b> (gives you PHP and MySQL in one), then install <b>Composer</b> "
    "from getcomposer.org, and <b>Node.js</b> from nodejs.org. Restart your terminal after "
    "each installation so the new commands become available."))

story.append(PageBreak())

# ================================================================
# CHAPTER 2 — STEP BY STEP INSTALLATION
# ================================================================
story.append(Paragraph("2. Step-by-Step Installation", H1))
story.append(Paragraph(
    "Once the tools above are installed, follow these steps in order. Open a terminal "
    "(Command Prompt or PowerShell) inside the project folder for every step.",
    BODY))

story.append(Paragraph("Step 1 — Install PHP dependencies", H3))
story.append(Paragraph(
    "This reads <font face='Courier'>composer.json</font> and downloads every PHP package "
    "the project needs into a folder called <font face='Courier'>vendor/</font>.",
    BODY))
story.append(code_block("composer install"))

story.append(Paragraph("Step 2 — Install JavaScript dependencies", H3))
story.append(Paragraph(
    "This reads <font face='Courier'>package.json</font> and downloads every JavaScript "
    "library (React, TailwindCSS, Leaflet, etc.) into <font face='Courier'>node_modules/</font>.",
    BODY))
story.append(code_block("npm install"))

story.append(Paragraph("Step 3 — Create the environment file", H3))
story.append(Paragraph(
    "The <font face='Courier'>.env</font> file holds all the secrets and configuration "
    "(database name, password, app URL). Copy the example file, then open it and set your "
    "MySQL details.",
    BODY))
story.append(code_block("copy .env.example .env"))
story.append(Paragraph("Then open <font face='Courier'>.env</font> and check these lines:", BODY))
story.append(code_block(
    "DB_CONNECTION=mysql\n"
    "DB_HOST=127.0.0.1\n"
    "DB_PORT=3306\n"
    "DB_DATABASE=iappoint\n"
    "DB_USERNAME=root\n"
    "DB_PASSWORD="
))

story.append(Paragraph("Step 4 — Generate the app key", H3))
story.append(Paragraph(
    "Laravel uses a secret key to encrypt cookies and sessions. This command creates one "
    "and writes it into <font face='Courier'>.env</font> automatically.",
    BODY))
story.append(code_block("php artisan key:generate"))

story.append(Paragraph("Step 5 — Create the database", H3))
story.append(Paragraph(
    "Open <b>phpMyAdmin</b> (or MySQL Workbench) and create an empty database named "
    "<font face='Courier'>iappoint</font>. No tables yet — the next step will create them.",
    BODY))

story.append(Paragraph("Step 6 — Run migrations and seed sample data", H3))
story.append(Paragraph(
    "This creates all the tables (users, appointments, schedules, messages, meetings, etc.) "
    "and inserts three sample accounts you can log in with right away.",
    BODY))
story.append(code_block("php artisan migrate --seed"))

story.append(Paragraph("Step 7 — Build the frontend assets (first time)", H3))
story.append(Paragraph(
    "Compiles React and TailwindCSS into files the browser can understand.",
    BODY))
story.append(code_block("npm run build"))

story.append(callout_box(
    "You're done installing!",
    "The next chapter shows you how to actually <b>start</b> the project every time you "
    "want to work on it.", bg=HexColor("#E8F5E9"), border=HexColor("#2E7D32")))

story.append(PageBreak())

# ================================================================
# CHAPTER 3 — RUNNING THE PROJECT
# ================================================================
story.append(Paragraph("3. Running the Project (Daily Use)", H1))
story.append(Paragraph(
    "Every time you want to work on iAppoint, you need <b>two terminals</b> open at the "
    "same time: one for the backend (Laravel) and one for the frontend (Vite). They must "
    "both keep running while you use the site.",
    BODY))

story.append(Paragraph("Terminal 1 — start the Laravel backend", H3))
story.append(code_block("php artisan serve"))
story.append(Paragraph(
    "This starts the backend at <font face='Courier'>http://127.0.0.1:8000</font>. Leave it running.",
    BODY))

story.append(Paragraph("Terminal 2 — start the Vite frontend", H3))
story.append(code_block("npm run dev"))
story.append(Paragraph(
    "This watches your React files and instantly rebuilds them when you edit anything.",
    BODY))

story.append(Paragraph("Shortcut — start everything at once", H3))
story.append(Paragraph(
    "The project also includes a shortcut command that runs the server, the queue worker, "
    "the log viewer, and Vite together, all in one terminal:",
    BODY))
story.append(code_block("composer run dev"))

story.append(Spacer(1, 6))
story.append(callout_box(
    "Reminder",
    "If you close the terminals, the website will stop working. Keep them open while "
    "you're using or demonstrating iAppoint."))

story.append(PageBreak())

# ================================================================
# CHAPTER 4 — THE TECH STACK
# ================================================================
story.append(Paragraph("4. The Tech Stack — What Was Installed and Why", H1))
story.append(Paragraph(
    "This chapter is the most important one for a panel defense. It tells you the name "
    "of every major package inside your project and — in plain words — what job it does. "
    "The packages are grouped so it's easier to remember.",
    BODY))

# --- Backend PHP packages
story.append(Paragraph("4.1 Backend PHP Packages (composer.json)", H2))
be = [
    ["Package", "What it does — in plain English"],
    ["laravel/framework ^12.0",
     "The main <b>Laravel framework</b>. It provides routing, controllers, database ORM, "
     "authentication, validation, and everything else that makes the backend work."],
    ["inertiajs/inertia-laravel ^2.0",
     "The <b>glue between Laravel and React</b>. It lets Laravel controllers return React "
     "pages directly, so you get a single-page-app feel without building a separate API."],
    ["laravel/sanctum ^4.0",
     "Handles <b>login sessions and API tokens</b>. It keeps track of which user is logged "
     "in and protects routes that require authentication."],
    ["tightenco/ziggy ^2.0",
     "Exposes all your Laravel <b>route names to JavaScript</b>. That's why in React you can "
     "write <font face='Courier'>route('dashboard')</font> and it just works."],
    ["laravel/tinker ^2.10",
     "An <b>interactive PHP shell</b> for the project. Useful for developers to test code "
     "or query the database from the command line."],
    ["laravel/breeze ^2.4 (dev)",
     "A starter kit that generated the <b>login, register, and password reset pages</b> "
     "for us. It saved us from writing all the auth screens from scratch."],
    ["laravel/pail (dev)",
     "A pretty <b>real-time log viewer</b> in the terminal. Helps developers see errors as "
     "they happen."],
    ["laravel/pint (dev)",
     "A <b>code formatter</b>. Keeps the PHP code style consistent across the project."],
    ["laravel/sail (dev)",
     "An optional <b>Docker setup</b>. Lets developers run the whole app inside containers."],
    ["fakerphp/faker (dev)",
     "Generates <b>fake test data</b> (random names, emails, etc.) for the seeders and tests."],
    ["phpunit/phpunit + mockery + collision (dev)",
     "Tools for writing and running <b>automated tests</b> with nice error messages."],
]
be_tbl = Table(be, colWidths=[2.2*inch, 4.2*inch])
be_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (0,-1), "Courier-Bold"),
    ("FONTNAME", (1,1), (1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 9.5),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, SOFT_BG]),
    ("GRID", (0,0), (-1,-1), 0.3, DIVIDER),
]))
story.append(be_tbl)

# Story flows naturally to next page; ReportLab handles pagination.

# --- Frontend JS packages
story.append(Paragraph("4.2 Frontend JavaScript Packages (package.json)", H2))
fe = [
    ["Package", "What it does — in plain English"],
    ["react ^18 + react-dom",
     "The <b>React library</b>. It builds the interactive user interface — buttons, forms, "
     "tables, everything the user sees and clicks."],
    ["@inertiajs/react ^2.0",
     "The React side of Inertia. It receives page data from Laravel and swaps pages "
     "<b>without a full browser refresh</b>."],
    ["vite ^7 + laravel-vite-plugin",
     "The <b>build tool</b>. It bundles React, CSS, and images. During development it also "
     "gives you instant reload when you edit code."],
    ["@vitejs/plugin-react",
     "Teaches Vite how to understand React's JSX syntax."],
    ["tailwindcss ^3 + @tailwindcss/vite + @tailwindcss/forms + autoprefixer + postcss",
     "<b>TailwindCSS</b> is a utility-first styling framework. Instead of writing separate "
     ".css files, you style elements directly with class names like "
     "<font face='Courier'>bg-blue-500 rounded-md</font>."],
    ["@headlessui/react",
     "<b>Accessible UI primitives</b> (dropdowns, modals) that come unstyled so Tailwind "
     "can decorate them."],
    ["@mui/material + @mui/icons-material + @emotion/react + @emotion/styled",
     "<b>Material UI</b>. A pre-built component library (nice buttons, tables, tabs, icons) "
     "used in some of the admin dashboards."],
    ["leaflet + react-leaflet + @types/leaflet",
     "<b>Interactive map library</b>. This powers the campus map that shows where faculty "
     "are located (the <i>Faculty Map</i> page)."],
    ["recharts ^3",
     "A <b>charting library</b> used by the Admin Reports page to draw graphs of "
     "appointments, users, etc."],
    ["axios ^1",
     "An <b>HTTP client</b> used to send background requests to the backend (for example, "
     "when uploading an avatar)."],
    ["typescript + @types/react + @types/react-dom",
     "<b>TypeScript</b> support, which adds type-safety hints for a safer codebase."],
    ["concurrently",
     "Runs several commands at the same time — used by the "
     "<font face='Courier'>composer run dev</font> shortcut."],
]
fe_tbl = Table(fe, colWidths=[2.2*inch, 4.2*inch])
fe_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (0,-1), "Courier-Bold"),
    ("FONTNAME", (1,1), (1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 9.5),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, SOFT_BG]),
    ("GRID", (0,0), (-1,-1), 0.3, DIVIDER),
]))
story.append(fe_tbl)

story.append(Spacer(1, 8))
story.append(callout_box(
    "If a panelist asks: 'Why did you use so many packages?'",
    "Say: <i>\"Each package solves one specific problem so we don't have to reinvent it. "
    "Laravel handles the backend, React handles the interface, Inertia connects them, "
    "TailwindCSS handles styling, and Leaflet handles the map. Every dependency in our "
    "project has a clear purpose.\"</i>"))

story.append(PageBreak())

# ================================================================
# CHAPTER 5 — HOW LARAVEL WORKS
# ================================================================
story.append(Paragraph("5. How Laravel Works — The Big Picture", H1))
story.append(Paragraph(
    "Before we zoom into Routes, Controllers, Models, and Migrations one by one, let's "
    "look at how a single click travels through the system. Imagine a student clicks the "
    "\"Book Appointment\" button.",
    BODY))

flow = [
    ["1. Browser",   "The student's browser sends a request like "
                     "<font face='Courier'>POST /appointments</font> to the server."],
    ["2. Route",     "Laravel checks <font face='Courier'>routes/web.php</font> to find "
                     "which controller handles that URL."],
    ["3. Middleware","Laravel first checks that the user is logged in and their account "
                     "is <b>active</b>. If not — access denied."],
    ["4. Controller","The matching controller method runs. It validates the form data, "
                     "then uses a <b>Model</b> to save the appointment."],
    ["5. Model",     "The Model talks to MySQL and creates a new row in the "
                     "<font face='Courier'>appointments</font> table."],
    ["6. Response",  "The controller returns an <b>Inertia response</b>. Inertia hands the "
                     "data to React, which redraws the page — no full reload."],
    ["7. Browser",   "The student sees a success message: <i>\"Appointment request submitted.\"</i>"],
]
flow_tbl = Table(
    [[Paragraph(f"<b>{a}</b>", BODY_L), Paragraph(b, BODY_L)] for a, b in flow],
    colWidths=[1.4*inch, 5.0*inch]
)
flow_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (0,-1), PRIMARY),
    ("TEXTCOLOR",  (0,0), (0,-1), white),
    ("LEFTPADDING",(0,0), (-1,-1), 8),
    ("RIGHTPADDING",(0,0), (-1,-1), 8),
    ("TOPPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING",(0,0), (-1,-1), 8),
    ("BOX", (0,0), (-1,-1), 0.4, DIVIDER),
    ("INNERGRID", (0,0), (-1,-1), 0.3, DIVIDER),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
]))
story.append(flow_tbl)

story.append(Spacer(1, 8))
story.append(callout_box(
    "Remember this analogy",
    "Think of Laravel like a restaurant. The <b>Route</b> is the door, the <b>Controller</b> "
    "is the waiter who takes your order, the <b>Model</b> is the chef who cooks by talking "
    "to the ingredients (the database), and the <b>Migration</b> is the blueprint of the "
    "kitchen shelves that hold those ingredients."))

story.append(PageBreak())

# ================================================================
# CHAPTER 6 — ROUTES
# ================================================================
story.append(Paragraph("6. Routes — The Front Door of the App", H1))
story.append(Paragraph(
    "A <b>Route</b> is simply a rule that says: <i>\"When someone visits this URL, run "
    "this piece of code.\"</i> All routes live in the folder "
    "<font face='Courier'>routes/</font>, mainly in "
    "<font face='Courier'>web.php</font> (for pages) and "
    "<font face='Courier'>auth.php</font> (for login/register).",
    BODY))

story.append(Paragraph("A real example from your project", H3))
story.append(Paragraph(
    "Here is one route taken from <font face='Courier'>routes/web.php</font>:",
    BODY))
story.append(code_block(
    "Route::get('/appointments', [AppointmentController::class, 'index'])\n"
    "    ->name('appointments.index');"
))
story.append(Paragraph(
    "Reading this in plain English: <i>\"When the browser asks for the URL "
    "<font face='Courier'>/appointments</font> using GET, run the <b>index</b> method "
    "of <b>AppointmentController</b>, and let us refer to this route by the nickname "
    "<font face='Courier'>appointments.index</font>.\"</i>",
    BODY))

story.append(Paragraph("The three parts of every route", H3))
story.append(bullet_list([
    "<b>HTTP verb</b> — GET (view a page), POST (submit a form), PATCH/PUT (update), "
    "DELETE (remove).",
    "<b>URL path</b> — the address the user visits, e.g. <font face='Courier'>/appointments</font>.",
    "<b>Handler</b> — the controller method that will actually do the work.",
]))

story.append(Paragraph("Groups and middleware", H3))
story.append(Paragraph(
    "You will notice many routes in your file are wrapped inside "
    "<font face='Courier'>Route::middleware(['auth', 'active'])-&gt;group(...)</font>. "
    "That's a shortcut that says: <i>\"Every route inside this group requires the user "
    "to be <b>logged in</b> and to have an <b>active</b> (approved) account.\"</i>",
    BODY))
story.append(code_block(
    "Route::middleware(['auth', 'active'])->group(function () {\n"
    "    Route::get('/appointments',  [AppointmentController::class, 'index']);\n"
    "    Route::post('/appointments', [AppointmentController::class, 'store']);\n"
    "    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy']);\n"
    "});"
))

story.append(Paragraph("Admin-only routes", H3))
story.append(Paragraph(
    "Admin routes are grouped under a <font face='Courier'>prefix('admin')</font> so their "
    "URLs all start with <font face='Courier'>/admin/...</font> and their names all start "
    "with <font face='Courier'>admin.</font> — this keeps the admin area cleanly separated.",
    BODY))

story.append(callout_box(
    "If a panelist asks: 'How does the app know which page to show?'",
    "Say: <i>\"Laravel matches the URL against the route list in "
    "<font face='Courier'>routes/web.php</font>. Each route points to a controller method. "
    "Middleware protects the sensitive routes so only logged-in and active users can reach "
    "them, and admin routes are grouped under a separate prefix.\"</i>"))

story.append(PageBreak())

# ================================================================
# CHAPTER 7 — CONTROLLERS
# ================================================================
story.append(Paragraph("7. Controllers — The Brain of Each Page", H1))
story.append(Paragraph(
    "A <b>Controller</b> is a PHP class that contains the logic for a group of related "
    "actions. It receives the request from the route, decides what to do, talks to the "
    "Model to fetch or save data, then returns a response (usually a page).",
    BODY))
story.append(Paragraph(
    "All controllers live inside <font face='Courier'>app/Http/Controllers/</font>. "
    "Your project has controllers for every big feature: Appointment, Meeting, Schedule, "
    "Friend, Conversation, Faculty, Profile, and an entire "
    "<font face='Courier'>Admin/</font> subfolder for admin-only controllers.",
    BODY))

story.append(Paragraph("A real example from your project", H3))
story.append(Paragraph(
    "Below is a simplified piece of "
    "<font face='Courier'>AppointmentController.php</font> — the "
    "<font face='Courier'>store</font> method that saves a new appointment request:",
    BODY))
story.append(code_block(
    "public function store(Request $request): RedirectResponse\n"
    "{\n"
    "    $user = $request->user();\n"
    "    abort_if(!$user->isStudent(), 403);\n"
    "\n"
    "    $data = $request->validate([\n"
    "        'faculty_id'   => ['required', Rule::exists('users', 'id')\n"
    "                            ->where('role', 'faculty')\n"
    "                            ->where('status', 'active')],\n"
    "        'title'        => 'required|string|max:200',\n"
    "        'message'      => 'nullable|string|max:1000',\n"
    "        'requested_at' => 'required|date|after:now',\n"
    "    ]);\n"
    "\n"
    "    $data['student_id'] = $user->id;\n"
    "    Appointment::create($data);\n"
    "\n"
    "    return back()->with('success',\n"
    "        'Appointment request submitted. Awaiting admin approval.');\n"
    "}"
))
story.append(Paragraph("Reading this line by line:", H3))
story.append(bullet_list([
    "<b>$request-&gt;user()</b> — grabs the currently logged-in user.",
    "<b>abort_if(!$user-&gt;isStudent(), 403)</b> — only students can book. Everyone else gets denied.",
    "<b>$request-&gt;validate([...])</b> — checks the form. If any rule fails, the user is "
    "sent back with error messages automatically.",
    "<b>Appointment::create($data)</b> — uses the <b>Model</b> to insert a new row into the "
    "<font face='Courier'>appointments</font> table.",
    "<b>return back()-&gt;with('success', ...)</b> — sends the user back to the previous "
    "page with a green success flash message.",
]))

story.append(callout_box(
    "If a panelist asks: 'Where is your business logic?'",
    "Say: <i>\"Inside our controllers under "
    "<font face='Courier'>app/Http/Controllers/</font>. Each controller is responsible for "
    "one feature — validation, permission checks, and calling the appropriate model. "
    "Complex, reusable logic is extracted into service classes under "
    "<font face='Courier'>app/Services/</font>.\"</i>"))

story.append(PageBreak())

# ================================================================
# CHAPTER 8 — MODELS
# ================================================================
story.append(Paragraph("8. Models — Talking to the Database", H1))
story.append(Paragraph(
    "A <b>Model</b> is a PHP class that represents <b>one table</b> in the database. "
    "It hides the SQL from you: instead of writing "
    "<font face='Courier'>SELECT * FROM appointments</font>, you just write "
    "<font face='Courier'>Appointment::all()</font>. This system is called an "
    "<b>Eloquent ORM</b> — Object Relational Mapper.",
    BODY))
story.append(Paragraph(
    "All models live in <font face='Courier'>app/Models/</font>. Your project has these: "
    "<b>User</b>, <b>Appointment</b>, <b>Schedule</b>, <b>Meeting</b>, <b>Friendship</b>, "
    "<b>Conversation</b>, <b>Message</b>, <b>FacultyStatus</b>, <b>CateringSession</b>, "
    "and <b>AuditLog</b>. Each one maps to a table with the same name (pluralised).",
    BODY))

story.append(Paragraph("A real example from your project", H3))
story.append(Paragraph(
    "Here is <font face='Courier'>app/Models/Appointment.php</font>:",
    BODY))
story.append(code_block(
    "class Appointment extends Model\n"
    "{\n"
    "    protected $fillable = [\n"
    "        'student_id', 'faculty_id', 'title', 'message',\n"
    "        'requested_at', 'status', 'admin_notes', 'approved_at',\n"
    "    ];\n"
    "\n"
    "    protected $casts = [\n"
    "        'requested_at' => 'datetime',\n"
    "        'approved_at'  => 'datetime',\n"
    "    ];\n"
    "\n"
    "    public function student(): BelongsTo\n"
    "    {\n"
    "        return $this->belongsTo(User::class, 'student_id');\n"
    "    }\n"
    "\n"
    "    public function faculty(): BelongsTo\n"
    "    {\n"
    "        return $this->belongsTo(User::class, 'faculty_id');\n"
    "    }\n"
    "}"
))
story.append(Paragraph("What each part means:", H3))
story.append(bullet_list([
    "<b>$fillable</b> — the list of columns that are allowed to be filled from a form. "
    "This blocks attackers from setting fields they shouldn't (mass-assignment protection).",
    "<b>$casts</b> — tells Laravel to convert database strings into real "
    "<font face='Courier'>DateTime</font> objects automatically.",
    "<b>student() / faculty()</b> — <b>relationships</b>. They say: <i>every appointment "
    "belongs to one student and one faculty (both are Users)</i>. Because of these methods "
    "you can write <font face='Courier'>$appointment-&gt;faculty-&gt;name</font> and "
    "Laravel fetches the related user automatically.",
]))

story.append(Paragraph("Relationship types used in your project", H3))
rel = [
    ["Relationship", "Meaning", "Example in your code"],
    ["hasMany", "One row owns many child rows", "A User has many Schedules"],
    ["belongsTo", "The inverse of hasMany", "An Appointment belongs to a User (student)"],
    ["belongsToMany", "Many-to-many through a pivot table",
     "A User belongs to many Conversations"],
    ["hasOne", "One row owns exactly one child", "A User has one FacultyStatus"],
]
rel_tbl = Table(rel, colWidths=[1.3*inch, 2.3*inch, 2.8*inch])
rel_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 10),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, SOFT_BG]),
    ("GRID", (0,0), (-1,-1), 0.3, DIVIDER),
]))
story.append(rel_tbl)

story.append(callout_box(
    "If a panelist asks: 'How do you avoid writing SQL?'",
    "Say: <i>\"We use Laravel's Eloquent ORM. Each database table is represented by a "
    "Model class, and relationships between tables are declared as methods. That way we "
    "read and write data using plain PHP objects instead of raw SQL.\"</i>"))

story.append(PageBreak())

# ================================================================
# CHAPTER 9 — MIGRATIONS
# ================================================================
story.append(Paragraph("9. Migrations — Building the Database", H1))
story.append(Paragraph(
    "A <b>Migration</b> is a PHP file that <b>describes</b> a change to the database "
    "(create a table, add a column, drop a column, etc.). Think of migrations as "
    "<b>version control for your database</b> — anyone can rebuild the exact same "
    "database on their computer just by running one command.",
    BODY))
story.append(Paragraph(
    "Migrations live in <font face='Courier'>database/migrations/</font>. They are named "
    "with a timestamp so Laravel knows the order to run them in. Your project has 20+ "
    "migrations, one for each table plus a few that add extra columns later "
    "(avatars, status, location consent, etc.).",
    BODY))

story.append(Paragraph("A real example from your project", H3))
story.append(Paragraph(
    "Below is the migration that creates the <font face='Courier'>appointments</font> table "
    "(<font face='Courier'>2026_06_01_000014_create_appointments_table.php</font>):",
    BODY))
story.append(code_block(
    "Schema::create('appointments', function (Blueprint $table) {\n"
    "    $table->id();\n"
    "    $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();\n"
    "    $table->foreignId('faculty_id')->constrained('users')->cascadeOnDelete();\n"
    "    $table->string('title');\n"
    "    $table->text('message')->nullable();\n"
    "    $table->dateTime('requested_at');\n"
    "    $table->enum('status', ['pending','approved','rejected'])->default('pending');\n"
    "    $table->text('admin_notes')->nullable();\n"
    "    $table->timestamp('approved_at')->nullable();\n"
    "    $table->timestamps();\n"
    "\n"
    "    $table->index(['student_id', 'status']);\n"
    "    $table->index(['faculty_id', 'status']);\n"
    "});"
))
story.append(Paragraph("What each line does:", H3))
story.append(bullet_list([
    "<b>$table-&gt;id()</b> — auto-incrementing primary key called <font face='Courier'>id</font>.",
    "<b>foreignId('student_id')-&gt;constrained('users')</b> — links this appointment to a "
    "row in the <font face='Courier'>users</font> table.",
    "<b>-&gt;cascadeOnDelete()</b> — if the user is deleted, their appointments are deleted "
    "too (keeps the database clean).",
    "<b>string / text / dateTime / enum</b> — the column types.",
    "<b>-&gt;nullable()</b> — the column is allowed to be empty.",
    "<b>-&gt;default('pending')</b> — new rows start with this value automatically.",
    "<b>timestamps()</b> — adds the <font face='Courier'>created_at</font> and "
    "<font face='Courier'>updated_at</font> columns.",
    "<b>index([...])</b> — makes searching by those columns much faster.",
]))

story.append(Paragraph("Useful migration commands", H3))
mcmd = [
    ["php artisan migrate",           "Runs any migrations that haven't been run yet."],
    ["php artisan migrate:fresh",     "Drops <b>all</b> tables and re-runs every migration from scratch."],
    ["php artisan migrate:fresh --seed", "Same as above, then also runs the seeders (sample data)."],
    ["php artisan migrate:rollback",  "Undoes the most recent batch of migrations."],
    ["php artisan make:migration ...","Creates a new empty migration file for you to fill in."],
]
mcmd_tbl = Table(
    [[Paragraph(f"<font face='Courier'><b>{c}</b></font>", BODY_L),
      Paragraph(d, BODY_L)] for c, d in mcmd],
    colWidths=[2.5*inch, 3.9*inch]
)
mcmd_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), SOFT_BG),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("RIGHTPADDING", (0,0), (-1,-1), 8),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("GRID", (0,0), (-1,-1), 0.3, DIVIDER),
]))
story.append(mcmd_tbl)

story.append(callout_box(
    "If a panelist asks: 'How is your database structured?'",
    "Say: <i>\"Our database schema is defined as code in the "
    "<font face='Courier'>database/migrations/</font> folder. Each migration creates or "
    "modifies one table. Running <font face='Courier'>php artisan migrate</font> builds the "
    "whole database automatically, which means any teammate can recreate the exact same "
    "structure on their own computer.\"</i>"))

story.append(PageBreak())

# ================================================================
# CHAPTER 10 — BACKEND VS FRONTEND
# ================================================================
story.append(Paragraph("10. Backend vs. Frontend — Who Does What?", H1))
story.append(Paragraph(
    "Every web app has two sides. Understanding the split makes it much easier to explain "
    "your project to a panel.",
    BODY))

split = [
    ["", "Backend (Laravel)", "Frontend (React)"],
    ["Language", "PHP 8.2", "JavaScript / JSX"],
    ["Location in project",
     "<font face='Courier'>app/</font>, <font face='Courier'>routes/</font>, "
     "<font face='Courier'>database/</font>, <font face='Courier'>config/</font>",
     "<font face='Courier'>resources/js/</font>"],
    ["Main job",
     "Receives requests, checks permissions, validates data, talks to MySQL, "
     "returns a response.",
     "Draws the interface, handles clicks and forms, shows animations, "
     "makes the app feel fast."],
    ["Runs on", "Your PHP server (<font face='Courier'>php artisan serve</font>)",
     "Your browser, built by Vite (<font face='Courier'>npm run dev</font>)"],
    ["Bridge between them",
     "Inertia serialises page data into JSON and hands it over.",
     "Inertia receives that JSON and renders the correct React page."],
]
split_tbl = Table(
    [[Paragraph(f"<b>{a}</b>", BODY_L),
      Paragraph(b, BODY_L),
      Paragraph(c, BODY_L)] for a, b, c in split],
    colWidths=[1.4*inch, 2.5*inch, 2.5*inch]
)
split_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("FONTSIZE", (0,0), (-1,-1), 10),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, SOFT_BG]),
    ("GRID", (0,0), (-1,-1), 0.3, DIVIDER),
]))
story.append(split_tbl)

story.append(Spacer(1, 10))
story.append(Paragraph("Where each of iAppoint's features lives", H2))
feat = [
    ["Feature", "Backend files", "Frontend files"],
    ["Appointments",
     "AppointmentController + Appointment model + migration",
     "resources/js/Pages/Appointments/Index.jsx"],
    ["Faculty directory &amp; map",
     "FacultyController",
     "resources/js/Pages/Faculty/Directory.jsx, Map.jsx"],
    ["Faculty schedule",
     "ScheduleController + Schedule model",
     "resources/js/Pages/Schedule/*"],
    ["Messaging",
     "ConversationController + Conversation/Message models",
     "resources/js/Pages/Messages/Index.jsx, Show.jsx"],
    ["Meetings",
     "MeetingController + Meeting model",
     "resources/js/Pages/Meetings/*"],
    ["Friends",
     "FriendController + Friendship model",
     "resources/js/Pages/Friends/*"],
    ["Admin: users/appointments/reports/audit",
     "Admin\\* controllers + AuditLog model",
     "resources/js/Pages/Admin/*"],
]
feat_tbl = Table(feat, colWidths=[1.6*inch, 2.3*inch, 2.5*inch])
feat_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9.5),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, SOFT_BG]),
    ("GRID", (0,0), (-1,-1), 0.3, DIVIDER),
]))
story.append(feat_tbl)

story.append(PageBreak())

# ================================================================
# CHAPTER 11 — SEED ACCOUNTS
# ================================================================
story.append(Paragraph("11. Login Accounts (Seeded Data)", H1))
story.append(Paragraph(
    "When you ran <font face='Courier'>php artisan migrate --seed</font>, the "
    "<font face='Courier'>DatabaseSeeder</font> inserted three ready-made accounts you "
    "can log in with immediately. All three share the same password: "
    "<font face='Courier'><b>password</b></font>.",
    BODY))

acc = [
    ["Role", "Email", "Password", "What they can do"],
    ["Admin",   "admin@scc.edu",   "password",
     "Approve/reject users and appointments, view reports and audit log."],
    ["Faculty", "faculty@scc.edu", "password",
     "Set schedule, share location, approve meetings, chat with friends."],
    ["Student", "student@scc.edu", "password",
     "Book appointments, chat, send meeting invites."],
]
acc_tbl = Table(acc, colWidths=[0.9*inch, 1.7*inch, 1.1*inch, 2.7*inch])
acc_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (1,1), (2,-1), "Courier"),
    ("FONTSIZE", (0,0), (-1,-1), 10.5),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, SOFT_BG]),
    ("GRID", (0,0), (-1,-1), 0.3, DIVIDER),
]))
story.append(acc_tbl)

story.append(Spacer(1, 8))
story.append(callout_box(
    "Where are these accounts defined?",
    "In <font face='Courier'>database/seeders/DatabaseSeeder.php</font>. Feel free to "
    "change the emails or add more seeded users — just re-run "
    "<font face='Courier'>php artisan migrate:fresh --seed</font> after editing."))

story.append(PageBreak())

# ================================================================
# CHAPTER 12 — TROUBLESHOOTING
# ================================================================
story.append(Paragraph("12. Troubleshooting Common Errors", H1))

trouble = [
    ["Symptom / Error", "What it means", "Fix"],
    ["\"No application encryption key has been specified\"",
     "You forgot to generate the APP_KEY.",
     "Run <font face='Courier'>php artisan key:generate</font>."],
    ["\"SQLSTATE[HY000] [2002] No connection\"",
     "MySQL is not running or your <font face='Courier'>.env</font> credentials are wrong.",
     "Start MySQL in XAMPP; check DB_USERNAME/DB_PASSWORD in "
     "<font face='Courier'>.env</font>."],
    ["\"Base table or view not found\"",
     "The migrations haven't been run yet.",
     "Run <font face='Courier'>php artisan migrate --seed</font>."],
    ["Blank white page after login",
     "Vite is not running, so React can't load.",
     "Open a second terminal and run <font face='Courier'>npm run dev</font>."],
    ["Old CSS or JS still showing",
     "The browser cached the old build.",
     "Hard-refresh with <font face='Courier'>Ctrl+Shift+R</font>, or run "
     "<font face='Courier'>npm run build</font> again."],
    ["\"Class not found\" after pulling new code",
     "The autoloader is out of date.",
     "Run <font face='Courier'>composer dump-autoload</font>."],
    ["Permission denied on storage/logs",
     "Laravel can't write to its log folder.",
     "Ensure the <font face='Courier'>storage/</font> folder is writable."],
]
trouble_tbl = Table(trouble, colWidths=[1.9*inch, 2.0*inch, 2.5*inch])
trouble_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 10),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, SOFT_BG]),
    ("GRID", (0,0), (-1,-1), 0.3, DIVIDER),
]))
story.append(trouble_tbl)

story.append(PageBreak())

# ================================================================
# CHAPTER 13 — PANEL Q&A CHEAT SHEET
# ================================================================
story.append(Paragraph("13. Panelist Q&A Cheat Sheet", H1))
story.append(Paragraph(
    "Below are the most likely panel questions and short, confident answers you can give. "
    "Read through this section a few times the night before your defense.",
    BODY))

qas = [
    ("What is your project about?",
     "iAppoint is a web-based faculty appointment and scheduling system. Students can find "
     "faculty members, view their schedules, chat, and request appointments. Faculty can "
     "manage their availability and location, and admins approve accounts and appointments."),
    ("What framework did you use and why?",
     "We used Laravel 12 for the backend because it's a modern, well-documented PHP "
     "framework that handles routing, authentication, database access, and validation "
     "out of the box. For the frontend we used React with Inertia.js so the site feels "
     "like a single-page application without needing to build a separate API."),
    ("What database do you use?",
     "MySQL 8. The schema is defined in Laravel migrations under "
     "database/migrations/, so anyone can rebuild the exact same tables with one command."),
    ("How does the front-end and back-end communicate?",
     "Through Inertia.js. Our Laravel controllers return Inertia responses that carry data "
     "as JSON, and Inertia hands that data to the correct React page, which then renders it."),
    ("How do you handle login and roles?",
     "Laravel Breeze generated the login and registration pages; Laravel Sanctum manages "
     "the sessions. Every user has a role — student, faculty, or admin — and a status. "
     "Middleware called 'auth' and 'active' protects routes so only logged-in and approved "
     "users can access them."),
    ("How do you make sure data is valid before saving?",
     "Every controller method uses Laravel's request validation. If a field is missing or "
     "the wrong type, the user is sent back with clear error messages, and nothing is saved."),
    ("What are Models, Controllers, Routes, and Migrations?",
     "Routes are the URLs. Controllers are the classes that decide what happens when a URL "
     "is visited. Models represent database tables and let us read and write records "
     "without writing SQL. Migrations are code files that define the shape of the database, "
     "so we can rebuild it identically anywhere."),
    ("What styling library do you use?",
     "TailwindCSS for the utility classes and Material UI for a few polished components "
     "like tables and icons in the admin dashboard."),
    ("How do you show the map of faculty locations?",
     "We use Leaflet through react-leaflet. Faculty who consent to sharing their location "
     "have their coordinates stored on their user profile, and the Faculty Map page plots "
     "them on an interactive map."),
    ("Is the code secure?",
     "Yes. Passwords are hashed with bcrypt, form fields are protected by mass-assignment "
     "guards ($fillable), all POST/PATCH/DELETE requests carry a CSRF token, and admin "
     "actions are recorded in an audit log."),
    ("Can it scale?",
     "Yes. Indexes are added on frequently searched columns, sessions and queues run on "
     "the database driver but can be switched to Redis with one line change in .env, and "
     "the frontend is a fast, single-page React app served by Vite."),
]
for q, a in qas:
    story.append(Paragraph(f"Q: {q}", H3))
    story.append(Paragraph(f"A: {a}", BODY))
    story.append(Spacer(1, 4))
    story.append(divider())
    story.append(Spacer(1, 4))

story.append(Spacer(1, 10))
story.append(callout_box(
    "You've got this.",
    "You don't need to memorise every line of code. You need to be able to explain, in "
    "your own words, <b>what</b> your project does, <b>why</b> each major package is there, "
    "and <b>how</b> a request travels from click → route → controller → model → database "
    "→ response. This guide has walked you through all of that.",
    bg=HexColor("#FFF7E6"), border=ACCENT))

# ---------- Build ----------
doc.build(story, onFirstPage=draw_page_chrome, onLaterPages=draw_page_chrome)
print(f"Generated: {OUTPUT}")
