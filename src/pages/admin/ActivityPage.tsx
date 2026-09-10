import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/utils";

export default function ActivityPage() {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getActivity().then(setActivity).finally(() => setLoading(false)); }, []);

  return (
    <div>
      <div className="section-head">
        <div><span className="eyebrow">Audit trail</span><h2>Change history.</h2></div>
        <p>Every important catalogue change is recorded here for review before or after publishing.</p>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div><h2>Activity log</h2><p>{activity.length} recorded events</p></div>
        </div>
        <div className="panel-body">
          {loading ? <div className="spinner" style={{ margin: "40px auto" }} /> : activity.length === 0 ? (
            <div className="empty">No history.</div>
          ) : activity.map((a) => (
            <div key={a.id} className="activity-row">
              <span className="a-dot" />
              <div style={{ flex: 1 }}>
                <strong>{a.action}</strong>
                <span>{a.description}</span>
                <span>{a.user || "Admin"} · {formatDate(a.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
