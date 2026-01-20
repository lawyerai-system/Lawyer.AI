# Project Migration Guide for LawAI 2.0

## 1. Zipping Instructions
You can Zip the **entire** `LawAI_2.0` folder including `node_modules`.
*   **Note**: If your new PC has a different architecture (e.g., Mac vs Windows), you should delete `node_modules` before zipping and run `npm install` on the new PC.
*   If both are Windows, zipping `node_modules` is fine, but if you encounter strange errors on the new PC, try deleting the `node_modules` folder and running `npm install`.

## 2. Setting up on New PC
1.  Unzip the folder to `D:\Projects\LawAI_2.0`.
2.  Open the folder in your code editor (Cursor/VS Code).
3.  Open the terminal in this folder.
4.  (Optional) If you didn't zip `node_modules`, run:
    ```bash
    npm install
    ```
5.  Start the server to verify it works:
    ```bash
    npm run dev
    ```

## 3. Resuming Work with AI (Antigravity)
When you open Antigravity on the new PC, paste the following prompt to restore my context and continue exactly where we left off:

---
**PASTE THIS INTO NEW CHAT:**

> I have migrated this project (LawAI 2.0) from another PC.
>
> **Current Status**:
> We are in the final stages of **Admin Panel Integration**.
> 1. **Completed**: Admin Layout, Dashboard, User Management, Lawyer Management (Verification), IPC Management (CRUD + MongoDB Migration).
> 2. **Recent Fixes**:
>    - Created a verified Admin User (`admin@lawai.com` / `admin123`) via `backend/scripts/createAdmin.js`.
>    - Fixed `AuthContext` to use a unified `src/utils/axios.js` for automatic token attachment.
>    - Updated `User` model to include `admin` in the role enum.
>
> **Context Files**:
> Please read the `task.md` and `walkthrough.md` files located in the root directory (`D:\Projects\LawAI_2.0`) to ingest the full project history and verification status.
>
> **Immediate Goal**:
> Verify the **Admin Login** works on this new machine using the credentials `admin@lawai.com` / `admin123`. Then, we need to check the **Dashboard Stability** (DashboardHome blank screen issue) which was a rollover task.
---
