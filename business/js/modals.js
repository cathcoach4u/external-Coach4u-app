(function () {
  const el = document.createElement('div');
  el.innerHTML = `

    <!-- Seat Modal -->
    <div class="modal-overlay hidden" id="seat-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="seat-modal-title">Add Seat</h3>
          <button class="modal-close" id="seat-modal-close">&#x2715;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="seat-id" />
          <div class="form-row">
            <div class="form-group">
              <label class="field-label">Seat Title *</label>
              <input type="text" class="field-input" id="seat-title" placeholder="e.g. Visionary" />
            </div>
            <div class="form-group">
              <label class="field-label">Person in Seat</label>
              <input type="text" class="field-input" id="seat-person" placeholder="Name" />
            </div>
          </div>
          <div class="form-group">
            <label class="field-label">Reports To (Parent Seat)</label>
            <select class="field-select" id="seat-parent">
              <option value="">None (Top Level)</option>
            </select>
          </div>
          <div class="form-group">
            <div class="field-label-row">
              <label class="field-label">Responsibilities (one per line)</label>
              <button class="btn-ai-suggest" id="ai-suggest-btn" type="button">&#x2728; Generate Responsibilities</button>
            </div>
            <textarea class="field-input" id="seat-responsibilities" rows="5" placeholder="Enter one per line, or click Generate above"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="seat-modal-cancel">Cancel</button>
          <button class="btn btn-danger hidden" id="seat-modal-delete">Delete Seat</button>
          <button class="btn btn-primary" id="seat-modal-save">Save Seat</button>
        </div>
      </div>
    </div>

    <!-- Rock Modal -->
    <div class="modal-overlay hidden" id="rock-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="rock-modal-title">Add Priority</h3>
          <button class="modal-close" id="rock-modal-close">&#x2715;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="rock-id" />
          <div class="form-group">
            <label class="field-label">Priority Description *</label>
            <textarea class="field-input" id="rock-description" rows="3" placeholder="What does this priority accomplish?"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="field-label">Owner</label>
              <input type="text" class="field-input" id="rock-owner" placeholder="Who owns this?" />
            </div>
            <div class="form-group">
              <label class="field-label">Status</label>
              <select class="field-select" id="rock-status">
                <option value="not_started">Not Started</option>
                <option value="on_track">On Track</option>
                <option value="off_track">Off Track</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="field-label">Quarter</label>
              <select class="field-select" id="rock-quarter">
                <option value="Q1 2026">Q1 2026</option>
                <option value="Q2 2026" selected>Q2 2026</option>
                <option value="Q3 2026">Q3 2026</option>
                <option value="Q4 2026">Q4 2026</option>
                <option value="Q1 2027">Q1 2027</option>
              </select>
            </div>
            <div class="form-group form-group-check">
              <label class="checkbox-label">
                <input type="checkbox" id="rock-company" />
                <span>Company Priority</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="rock-modal-cancel">Cancel</button>
          <button class="btn btn-danger hidden" id="rock-modal-delete">Delete Priority</button>
          <button class="btn btn-primary" id="rock-modal-save">Save Priority</button>
        </div>
      </div>
    </div>

    <!-- Metric Modal -->
    <div class="modal-overlay hidden" id="metric-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Add Metric</h3>
          <button class="modal-close" id="metric-modal-close">&#x2715;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="metric-id" />
          <div class="form-row">
            <div class="form-group">
              <label class="field-label">Metric Name *</label>
              <input type="text" class="field-input" id="metric-name" placeholder="e.g. New Leads" />
            </div>
            <div class="form-group">
              <label class="field-label">Owner</label>
              <input type="text" class="field-input" id="metric-owner" placeholder="Name" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="field-label">Weekly Goal</label>
              <input type="text" class="field-input" id="metric-goal" placeholder="e.g. 5" />
            </div>
            <div class="form-group">
              <label class="field-label">Type</label>
              <select class="field-select" id="metric-type">
                <option value="number">Number</option>
                <option value="currency">Currency ($)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="metric-modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="metric-modal-save">Save Metric</button>
        </div>
      </div>
    </div>

    <!-- Issue Modal -->
    <div class="modal-overlay hidden" id="issue-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="issue-modal-title">Add Issue</h3>
          <button class="modal-close" id="issue-modal-close">&#x2715;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="issue-id" />
          <div class="form-group">
            <label class="field-label">Issue Description *</label>
            <textarea class="field-input" id="issue-description" rows="3" placeholder="Describe the issue clearly..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="field-label">Owner</label>
              <input type="text" class="field-input" id="issue-owner" placeholder="Who raised this?" />
            </div>
            <div class="form-group">
              <label class="field-label">Priority</label>
              <select class="field-select" id="issue-priority">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div class="form-group" id="issue-solution-group" style="display:none;">
            <label class="field-label">Solution (required to resolve)</label>
            <textarea class="field-input" id="issue-solution" rows="3" placeholder="How was this solved?"></textarea>
          </div>
          <div class="form-group">
            <label class="field-label">Status</label>
            <select class="field-select" id="issue-status">
              <option value="open">Open</option>
              <option value="ids_in_progress">In IDS</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="issue-modal-cancel">Cancel</button>
          <button class="btn btn-danger hidden" id="issue-modal-delete">Delete Issue</button>
          <button class="btn btn-primary" id="issue-modal-save">Save Issue</button>
        </div>
      </div>
    </div>

    <!-- Meeting Modal -->
    <div class="modal-overlay hidden" id="meeting-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">New Weekly Meeting</h3>
          <button class="modal-close" id="meeting-modal-close">&#x2715;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="field-label">Meeting Date *</label>
              <input type="date" class="field-input" id="meeting-date" />
            </div>
            <div class="form-group">
              <label class="field-label">Quarter</label>
              <select class="field-select" id="meeting-quarter">
                <option value="Q1 2026">Q1 2026</option>
                <option value="Q2 2026" selected>Q2 2026</option>
                <option value="Q3 2026">Q3 2026</option>
                <option value="Q4 2026">Q4 2026</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="meeting-modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="meeting-modal-save">Create Meeting</button>
        </div>
      </div>
    </div>

    <!-- Team Member Modal -->
    <div class="modal-overlay hidden" id="member-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="member-modal-title">Add Team Member</h3>
          <button class="modal-close" id="member-modal-close">&#x2715;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="member-id" />
          <div class="form-row">
            <div class="form-group">
              <label class="field-label">Name *</label>
              <input type="text" class="field-input" id="member-name" placeholder="Full name" />
            </div>
            <div class="form-group">
              <label class="field-label">Seat / Role</label>
              <select class="field-select" id="member-seat">
                <option value="">No seat assigned</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="member-modal-cancel">Cancel</button>
          <button class="btn btn-danger hidden" id="member-modal-delete">Remove</button>
          <button class="btn btn-primary" id="member-modal-save">Save</button>
        </div>
      </div>
    </div>

    <!-- Manage Businesses Modal -->
    <div class="modal-overlay hidden" id="biz-manage-modal">
      <div class="modal modal-wide">
        <div class="modal-header">
          <h3 class="modal-title">Manage Businesses</h3>
          <button class="modal-close" id="biz-manage-modal-close">&#x2715;</button>
        </div>
        <div class="modal-body">
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">
            The holding company sits at the top. Sub-businesses run beneath it — each with their own strategy, rocks, scorecard, and issues that roll up to the group view.
          </p>
          <div id="biz-manage-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;"></div>
          <button class="btn btn-primary" id="biz-add-new-btn">+ Add Sub-Business</button>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="biz-manage-modal-close2">Close</button>
        </div>
      </div>
    </div>

    <!-- Add / Edit Business Modal -->
    <div class="modal-overlay hidden" id="biz-edit-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="biz-edit-modal-title">Add Sub-Business</h3>
          <button class="modal-close" id="biz-edit-modal-close">&#x2715;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="biz-edit-id" />
          <div class="form-group">
            <label class="field-label">Business Name *</label>
            <input type="text" class="field-input" id="biz-edit-name" placeholder="e.g. Coaching Division" />
          </div>
          <div class="form-group">
            <label class="field-label">Colour</label>
            <div class="biz-color-swatches" id="biz-color-swatches"></div>
            <input type="hidden" id="biz-edit-color" value="#3b82f6" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="biz-edit-cancel">Cancel</button>
          <button class="btn btn-danger hidden" id="biz-edit-delete">Delete Business</button>
          <button class="btn btn-primary" id="biz-edit-save">Save</button>
        </div>
      </div>
    </div>

    <!-- Scorecard Cell Popover -->
    <div class="cell-popover hidden" id="cell-popover">
      <div class="cell-popover-inner">
        <input type="number" class="cell-popover-input" id="cell-popover-input" placeholder="Value" step="any" />
        <div class="cell-popover-btns">
          <button class="btn btn-sm btn-ghost" id="cell-popover-cancel">&#x2715;</button>
          <button class="btn btn-sm btn-primary" id="cell-popover-save">&#x2713;</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast hidden" id="toast"></div>

    <!-- AI Coach FAB -->
    <button class="ai-coach-fab" id="ai-coach-fab" title="Open AI Strategy Coach">
      &#x1F4A1; <span>AI Strategy Coach</span>
    </button>

    <!-- AI Coach Sidebar -->
    <div class="ai-coach-sidebar hidden" id="ai-coach-sidebar">
      <div class="ai-coach-header">
        <div class="ai-coach-header-left">
          <span class="ai-coach-avatar">&#x1F4A1;</span>
          <div>
            <div class="ai-coach-name">AI Strategy Coach</div>
            <div class="ai-coach-status">Powered by Claude</div>
          </div>
        </div>
        <button class="ai-coach-close" id="ai-coach-close">&#x2715;</button>
      </div>
      <div class="ai-coach-messages" id="ai-coach-messages"></div>
      <div class="ai-coach-input-area">
        <textarea class="ai-coach-input" id="ai-coach-input" rows="2" placeholder="Ask me anything about your strategy&#x2026;"></textarea>
        <button class="ai-coach-send" id="ai-coach-send">&#x27A4;</button>
      </div>
    </div>

  `;
  document.body.appendChild(el);
})();
