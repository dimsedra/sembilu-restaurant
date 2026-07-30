# ADR-0001: Single project, dual audience

The system serves both restaurant customers and restaurant staff (waiters, chefs, managers) from the same codebase. Customer routes are public; staff routes require auth. They share one database and one real-time layer.

**Context:** We started with a homepage mockup, but the real need is a restaurant operating system — the public website is just one facet. Separating customer and staff into different projects would force us to duplicate the domain logic (menu, orders, reservations) and keep two databases in sync.

**Considered option:** Two separate projects with an API between them. Rejected because every order, reservation, and menu item lives in one place — splitting them across projects creates a sync problem that doesn't exist in a real restaurant.

**Consequence:** The project has two UI personalities — the warm, brand-first marketing look for customers and a utilitarian dashboard for staff. Both share the same React components where possible but diverge in layout and density. Auth is required on staff routes.
