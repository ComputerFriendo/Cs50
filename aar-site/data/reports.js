/* AAR Compiler & Knowledge Center — data/reports.js
   Report archive: publicly available government after-action and review reports.
   RULES FOR EDITING:
   - Link to the original official document or the agency's official page. Never link to unofficial copies.
   - `url` is null when the exact official address has not been confirmed; the site then shows the agency site and a search tip.
   - Summaries are site-written and must be labelled as such (the page does this automatically). Keep them short and factual.
   - Leave strengths/findings/lessons/actions empty unless they were taken from the official document; the page then says
     "Not yet summarized — read the official report" instead of guessing.
   - Set `verified` (YYYY-MM-DD) only after a person opened the link. BUILD NOTE: none verified at build time (no network access). */
window.AAR = window.AAR || {};
window.AAR.REPORTS = [
  { id: "katrina-lessons", title: "The Federal Response to Hurricane Katrina: Lessons Learned", agency: "The White House (Homeland Security Council)", event: "Hurricane Katrina",
    eventDate: "2005-08", published: "2006-02", jurisdiction: "United States (federal)", type: "Federal lessons-learned review", categories: ["Hurricanes", "Natural disasters", "Emergency management"],
    format: "Web pages (archived)", url: "https://georgewbush-whitehouse.archives.gov/reports/katrina-lessons-learned/", agencySite: "",
    summary: "A federal review of the national response to Hurricane Katrina, published in February 2006. It describes the response, identifies lessons learned and makes recommendations to improve national preparedness. Hosted on the archived White House website.",
    strengths: [], findings: [], lessons: [], actions: [], tags: ["hurricane", "federal response", "national preparedness"], related: ["fema-2017"], verified: null },
  { id: "fema-2017", title: "2017 Hurricane Season FEMA After-Action Report", agency: "FEMA", event: "Hurricanes Harvey, Irma and Maria and the 2017 California wildfires",
    eventDate: "2017", published: "2018-07", jurisdiction: "United States (federal)", type: "Agency after-action report", categories: ["Hurricanes", "Wildfires", "Natural disasters", "Emergency management"],
    format: "PDF", url: "https://www.fema.gov/sites/default/files/2020-08/fema_hurricane-season-after-action-report_2017.pdf", agencySite: "https://www.fema.gov/",
    summary: "FEMA's review of its own performance during the 2017 hurricane season, including Hurricanes Harvey, Irma and Maria and the California wildfires. A useful model of an agency-level AAR covering several concurrent events. If the PDF has moved, search FEMA's site for the title.",
    strengths: [], findings: [], lessons: [], actions: [], tags: ["hurricane", "FEMA", "Puerto Rico", "concurrent disasters"], related: ["katrina-lessons", "sandy-fema"], verified: null },
  { id: "sandy-fema", title: "Hurricane Sandy FEMA After-Action Report", agency: "FEMA", event: "Hurricane Sandy",
    eventDate: "2012-10", published: "2013-07", jurisdiction: "United States (federal)", type: "Agency after-action report", categories: ["Hurricanes", "Natural disasters", "Emergency management"],
    format: "PDF", url: null, agencySite: "https://www.fema.gov/", searchHint: "Search fema.gov for \"Hurricane Sandy FEMA After-Action Report\".",
    summary: "FEMA's after-action review of its response to Hurricane Sandy in 2012. The exact official link has not yet been confirmed for this site.",
    strengths: [], findings: [], lessons: [], actions: [], tags: ["hurricane", "FEMA", "Northeast"], related: ["fema-2017"], verified: null },
  { id: "uvalde-cir", title: "Critical Incident Review: Active Shooter at Robb Elementary School", agency: "U.S. Department of Justice, COPS Office", event: "Robb Elementary School shooting, Uvalde, Texas",
    eventDate: "2022-05", published: "2024-01", jurisdiction: "Uvalde, Texas", type: "Federal critical incident review", categories: ["Law enforcement", "Public safety", "Emergency management"],
    format: "Web page and PDF", url: "https://cops.usdoj.gov/uvalde", agencySite: "https://cops.usdoj.gov/",
    summary: "A Department of Justice review of the law enforcement response to the May 2022 school shooting in Uvalde, Texas, released in January 2024. An example of a detailed, timeline-driven public review with findings and recommendations across multiple agencies.",
    strengths: [], findings: [], lessons: [], actions: [], tags: ["active shooter", "law enforcement", "multi-agency", "timeline"], related: [], verified: null },
  { id: "nine-eleven", title: "The 9/11 Commission Report", agency: "National Commission on Terrorist Attacks Upon the United States", event: "September 11, 2001 attacks",
    eventDate: "2001-09", published: "2004-07", jurisdiction: "United States (federal)", type: "Commission report (not an AAR)", categories: ["Public safety", "Emergency management", "Organizational reviews"],
    format: "Web site (archived) and PDF", url: "https://www.9-11commission.gov/report/", agencySite: "",
    summary: "The final report of the independent bipartisan commission on the September 11 attacks. It is a commission investigation rather than an AAR, but its emergency response chapters and recommendations are widely studied for coordination and communication lessons.",
    strengths: [], findings: [], lessons: [], actions: [], tags: ["terrorism", "commission", "interoperability"], related: [], verified: null },
  { id: "i35w-ntsb", title: "Collapse of I-35W Highway Bridge, Minneapolis, Minnesota, August 1, 2007 (NTSB/HAR-08/03)", agency: "NTSB", event: "I-35W Mississippi River bridge collapse",
    eventDate: "2007-08", published: "2008-11", jurisdiction: "Minneapolis, Minnesota", type: "Accident investigation report (not an AAR)", categories: ["Infrastructure", "Transportation"],
    format: "PDF", url: "https://www.ntsb.gov/investigations/AccidentReports/Reports/HAR0803.pdf", agencySite: "https://www.ntsb.gov/",
    summary: "The NTSB's highway accident report on the 2007 collapse of the I-35W bridge. A formal investigation with a probable cause statement and safety recommendations; a model for evidence-based findings on infrastructure failures.",
    strengths: [], findings: [], lessons: [], actions: [], tags: ["bridge", "infrastructure", "probable cause", "safety recommendations"], related: [], verified: null },
  { id: "ferc-uri", title: "The February 2021 Cold Weather Outages in Texas and the South Central United States", agency: "FERC and NERC", event: "Winter Storm Uri",
    eventDate: "2021-02", published: "2021-11", jurisdiction: "Texas and South Central United States", type: "Joint inquiry report", categories: ["Winter storms", "Infrastructure", "Natural disasters"],
    format: "PDF", url: null, agencySite: "https://www.ferc.gov/", searchHint: "Search ferc.gov for \"February 2021 Cold Weather Outages\".",
    summary: "A joint Federal Energy Regulatory Commission and North American Electric Reliability Corporation inquiry into the power generation outages during the February 2021 winter storm. The exact official link has not yet been confirmed for this site.",
    strengths: [], findings: [], lessons: [], actions: [], tags: ["power grid", "cold weather", "energy"], related: [], verified: null },
  { id: "boston-2013", title: "After Action Report for the Response to the 2013 Boston Marathon Bombings", agency: "Massachusetts Emergency Management Agency and partner agencies", event: "Boston Marathon bombings",
    eventDate: "2013-04", published: "2014-12", jurisdiction: "Boston, Massachusetts", type: "Multi-agency after-action report", categories: ["Major events", "Public safety", "EMS", "Law enforcement"],
    format: "PDF", url: null, agencySite: "https://www.mass.gov/", searchHint: "Search mass.gov for \"Boston Marathon bombings after action report\".",
    summary: "A multi-agency AAR of the response to the 2013 Boston Marathon bombings, often cited for planned-event preparedness and mass-casualty response. The exact official link has not yet been confirmed for this site.",
    strengths: [], findings: [], lessons: [], actions: [], tags: ["planned event", "mass casualty", "multi-agency"], related: [], verified: null },
  { id: "cascadia-2016", title: "Cascadia Rising 2016 Exercise Joint After-Action Report", agency: "FEMA Region 10 and partner states", event: "Cascadia Rising 2016 functional exercise",
    eventDate: "2016-06", published: "2017", jurisdiction: "Pacific Northwest (Washington, Oregon, Idaho)", type: "Exercise after-action report", categories: ["Exercises", "Earthquakes", "Emergency management"],
    format: "PDF", url: null, agencySite: "https://www.fema.gov/", searchHint: "Search fema.gov for \"Cascadia Rising 2016 After-Action Report\".",
    summary: "A joint AAR for a large-scale exercise simulating a Cascadia Subduction Zone earthquake and tsunami. A good example of an exercise AAR organized around capabilities and improvement planning. The exact official link has not yet been confirmed for this site.",
    strengths: [], findings: [], lessons: [], actions: [], tags: ["exercise", "earthquake", "tsunami", "catastrophic planning"], related: [], verified: null },
  { id: "h1n1-hhs", title: "An HHS Retrospective on the 2009 H1N1 Influenza Pandemic to Advance All Hazards Preparedness", agency: "U.S. Department of Health and Human Services", event: "2009 H1N1 influenza pandemic",
    eventDate: "2009", published: "2012", jurisdiction: "United States (federal)", type: "Federal retrospective review", categories: ["Public health"],
    format: "PDF", url: null, agencySite: "https://www.hhs.gov/", searchHint: "Search hhs.gov or phe.gov for \"HHS Retrospective on the 2009 H1N1 Influenza Pandemic\".",
    summary: "HHS's retrospective review of the federal public health response to the 2009 H1N1 pandemic. The exact official link has not yet been confirmed for this site.",
    strengths: [], findings: [], lessons: [], actions: [], tags: ["pandemic", "influenza", "public health"], related: [], verified: null },
  { id: "lahaina-fsri", title: "Lahaina Fire Comprehensive Timeline Report", agency: "Hawaii Department of the Attorney General (prepared by the Fire Safety Research Institute)", event: "August 2023 Lahaina wildfire, Maui",
    eventDate: "2023-08", published: "2024-04", jurisdiction: "Maui County, Hawaii", type: "State-commissioned review (phase one)", categories: ["Wildfires", "Natural disasters", "Evacuations", "Fire services"],
    format: "PDF", url: null, agencySite: "https://ag.hawaii.gov/", searchHint: "Search ag.hawaii.gov for \"Lahaina Fire\" reports.",
    summary: "The first phase of an independent review commissioned by the Hawaii Attorney General, focused on building a detailed timeline of the Lahaina fire. A strong example of timeline reconstruction from many sources. The exact official link has not yet been confirmed for this site.",
    strengths: [], findings: [], lessons: [], actions: [], tags: ["wildfire", "timeline", "evacuation"], related: [], verified: null }
];
