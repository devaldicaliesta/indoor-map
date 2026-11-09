# Graph Report - indoor-map  (2026-11-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 7942 nodes · 25101 edges · 288 communities (218 shown, 70 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 378 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ccae28bc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187
- Community 188
- Community 189
- Community 190
- Community 191
- Community 192
- Community 193
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Community 199
- Community 200
- Community 201
- Community 202
- Community 203
- Community 204
- Community 205
- Community 206
- Community 207
- Community 208
- Community 209
- Community 210
- Community 211
- Community 212
- Community 213
- Community 214
- Community 215
- Community 216
- Community 217
- Community 218
- Community 219
- Community 220
- Community 221
- Community 222
- Community 224
- Community 226
- Community 227
- Community 231
- Community 234
- Community 235
- Community 236
- Community 237
- Community 238
- Community 239
- Community 240
- Community 244

## God Nodes (most connected - your core abstractions)
1. `Button()` - 250 edges
2. `VenueId` - 192 edges
3. `cn()` - 144 edges
4. `Input()` - 108 edges
5. `test` - 105 edges
6. `createRepositories()` - 94 edges
7. `toDataError()` - 88 edges
8. `DataError` - 84 edges
9. `FormNotice()` - 74 edges
10. `Label()` - 66 edges

## Surprising Connections (you probably didn't know these)
- `Attempt` --references--> `DataClient`  [EXTRACTED]
  e2e/support/role-attempts.ts → packages/data/src/client.ts
- `FloorTarget` --references--> `BuildingId`  [EXTRACTED]
  apps/admin/src/features/venues/floors/queries.ts → packages/domain/src/ids.ts
- `DemoRouteOptions` --references--> `Snapshot`  [EXTRACTED]
  apps/landing/src/demo/use-demo-route.ts → packages/domain/src/snapshot.ts
- `submit()` --indirect_call--> `position()`  [INFERRED]
  apps/admin/src/features/editor/connectors/connector-dialog.tsx → packages/routing/src/legs.ts
- `submit()` --indirect_call--> `idle()`  [INFERRED]
  apps/admin/src/features/info-points/info-point-dialog.tsx → e2e/tests/visitor/verify/T-104-map-core.spec.ts

## Import Cycles
- None detected.

## Communities (288 total, 70 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (142): ColorField(), isColorValue(), Field(), AliasField(), FormNotice(), ClosureForm(), NO_CLOSURES, floorLabel() (+134 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (110): createAuthRepository(), signOut(), Tables, TablesUpdate, CODE_RULES, CodeRule, DataError, DataErrorKind (+102 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (125): Can(), useFloorSelection(), FacilityIconPreview(), FILTERS, Open, iconSource(), PICTOGRAM_LABELS, facilityTypesKey() (+117 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (31): test, TEST_CENTER, AdminShell, EditorPage, EditorTool, at(), drawUnit(), ring() (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (76): RFC-6238, createRepositories(), CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums (+68 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (96): GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), useAuthSync(), useCurrentProfile(), RequireAuth(), HomeRedirect() (+88 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (84): submit(), ClosureMarkData, SnapshotConnectorKind, SnapshotGraph, SnapshotPosition, ARC_ACCESSIBLE, ARC_CONNECTOR, ArcDraft (+76 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (69): AccountMenu(), AppLayout(), NarrowScreenNotice(), subscribe(), NavItem(), Sidebar(), SidebarState, useSidebar (+61 more)

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (58): createCadConverterRepository(), post(), createEditLocksRepository(), acquire(), EditLocksRepository, Endpoint, LockRow, mapLockRow() (+50 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (73): currentProfileKey, Providers(), NON_RETRYABLE, queryClient, AuthLayout(), ForgotPasswordPage(), ACTIVITY_EVENTS, clearActivity() (+65 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (86): BrandGallery(), COLUMNS, DataTableGallery(), date, DEMO_STATES, DemoState, FILTERS, FLOORS (+78 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (48): ACCOUNTS, env, envFile, Fixtures, FOOTPRINT, linkUnitsToPath(), PublishedVenue, TestVenue (+40 more)

### Community 12 - "Community 12"
Cohesion: 0.03
Nodes (69): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+61 more)

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (84): loadCrowd(), SnapshotNodeRole, areaSpots(), arrive(), between(), blankPerson(), buildNets(), createCrowd() (+76 more)

### Community 14 - "Community 14"
Cohesion: 0.04
Nodes (57): Geometry, COORDINATE_DECIMALS, createFeatureEditor(), onClick(), drawStyles(), EditableFeature, editableFlags(), FeatureEditor (+49 more)

### Community 15 - "Community 15"
Cohesion: 0.03
Nodes (63): page, diagnoseWriteRejection(), sql(), json(), read(), results, root, DESKTOP (+55 more)

### Community 16 - "Community 16"
Cohesion: 0.03
Nodes (28): VenueSelection, DataClient, AliasesRepository, aliasKey(), AliasRow, groupAliasRows(), CategoriesRepository, ConnectorsRepository (+20 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (72): EntranceFeature, FeatureKind, MapFeatureProperties, MapLabel, DEFAULT_FILL, DEFAULT_HEIGHTS, DEFAULT_OUTLINE, MAP_BACKGROUND (+64 more)

### Community 18 - "Community 18"
Cohesion: 0.06
Nodes (72): COLUMNS, dateFormat, FILTERS, FloorPlanHistory(), FloorPlanVersion, FIELDS_PREFIX, FieldsTable(), moveTo() (+64 more)

### Community 19 - "Community 19"
Cohesion: 0.06
Nodes (76): DEV_KEY, newDb(), signedLicense(), signIn(), DEV_KEY, newDb(), paidLicense(), signIn() (+68 more)

### Community 20 - "Community 20"
Cohesion: 0.05
Nodes (58): EMPTY, RouteEndName, StepFocus, TestRouteState, RouteGraphStatus, featureName(), featurePosition(), featureView() (+50 more)

### Community 21 - "Community 21"
Cohesion: 0.06
Nodes (67): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+59 more)

### Community 22 - "Community 22"
Cohesion: 0.05
Nodes (56): closureTargetAt(), interceptCanvasClick(), PlanBackground, EDIT_COLORS, Corners, attributed, Basemap, BASEMAP_LAYER_ID (+48 more)

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (58): GraphLayer(), GraphStatus, graphSnapFeatures(), graphViews(), neighbourPositions(), NO_STATUS, floorGraph(), OriginMap() (+50 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (56): others, TimezoneSelect(), VenuePicker(), AREA_KINDS, targetKey(), TargetPicker(), FloorFields(), FloorSelect() (+48 more)

### Community 25 - "Community 25"
Cohesion: 0.04
Nodes (40): DataClientConfig, CadConverterRepository, CadLayer, CadRender, STATUS_KINDS, ActivatedLicense, CheckinResult, FirstAdminInput (+32 more)

### Community 26 - "Community 26"
Cohesion: 0.05
Nodes (54): BPM, Copy, COPY, EN, ID, SCENES, assets, drawScene() (+46 more)

### Community 27 - "Community 27"
Cohesion: 0.04
Nodes (43): app.user_role(), audit_events_occurred_idx, public.audit_events, public.profiles, public.system_settings, app.hook_password_verification_attempt(), app.guard_last_super_admin(), app.log_profile_changes() (+35 more)

### Community 28 - "Community 28"
Cohesion: 0.05
Nodes (51): expected(), customFieldsOf(), FloorEmbed, hoursToRows(), IMAGE_EXTENSIONS, IMPORT_BATCH, LocationImages, LocationPageFilters (+43 more)

### Community 29 - "Community 29"
Cohesion: 0.06
Nodes (51): PlaceSources, RouteSources, InstructionErrors, previewInstruction(), SAMPLE, SAMPLE_FLOOR, validateInstruction(), distanceM() (+43 more)

### Community 30 - "Community 30"
Cohesion: 0.08
Nodes (53): EntityIcon(), ListRow(), data, FacilityDetail(), Missing(), UnitDetail(), FieldValue(), LocationProfile() (+45 more)

### Community 31 - "Community 31"
Cohesion: 0.08
Nodes (50): PanelMessage(), MapArea(), VisitorShell(), graphQuery(), loadSnapshot(), loadSnapshotWithGraph(), snapshotKey(), useRouteSnapshot() (+42 more)

### Community 32 - "Community 32"
Cohesion: 0.08
Nodes (58): InsertedVenue, LocationPlace, Place, hasOpeningHours(), OpeningHours, INFO_POINT_ZOOM, infoPointSnapshot(), buildSnapshot() (+50 more)

### Community 33 - "Community 33"
Cohesion: 0.06
Nodes (54): TrialForm(), Banner(), CheckinNotice(), date, LicenseNotice(), ValidityNotice(), ActionLimits(), CHECKIN_RESULTS (+46 more)

### Community 34 - "Community 34"
Cohesion: 0.05
Nodes (16): VisitorPage, capture(), shot(), shot(), visitorSearch(), collator, Demo, createFullVenue() (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.07
Nodes (28): createHostedTrial(), endHostedTrial(), HostedTrialUser, removeHostedTrial(), currentLicenseId(), DEV_KEY, devLicenseFile(), releaseLicense() (+20 more)

### Community 36 - "Community 36"
Cohesion: 0.06
Nodes (50): capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText(), floorGap() (+42 more)

### Community 37 - "Community 37"
Cohesion: 0.08
Nodes (50): shownFloorOf(), CameraPadding, fitBearing(), focusCamera(), InitialCamera, initialCamera(), MAP_GAP_PX, features (+42 more)

### Community 38 - "Community 38"
Cohesion: 0.07
Nodes (55): areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, checkPolygon(), duplicateCodeIssues(), GEOMETRY_ISSUE_CODES, GeometryIssueCode (+47 more)

### Community 39 - "Community 39"
Cohesion: 0.06
Nodes (43): stepFocus(), useTestRoutePlan(), base, snapshot, facility, index, snapshot, at() (+35 more)

### Community 40 - "Community 40"
Cohesion: 0.06
Nodes (39): AUDIT_LABELS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES, roleLabel(), SETTING_FIELDS, target (+31 more)

### Community 41 - "Community 41"
Cohesion: 0.07
Nodes (47): ClosureDialog(), useClosureDialog, ClosurePlaces, Closures(), FILTERS, isState(), STATES, STATUS (+39 more)

### Community 42 - "Community 42"
Cohesion: 0.05
Nodes (51): DisplayField, PREVIEW_READY, PREVIEW_SNAPSHOT, PreviewSnapshotMessage, readPreviewMessage(), withPreviewMode(), INSTRUCTION_ACTIONS, BuildingSchema (+43 more)

### Community 43 - "Community 43"
Cohesion: 0.10
Nodes (47): resize(), FALLBACK_CENTER, footprintBox(), loadImageSize(), Measure, startingPlacement(), useGeoreference(), calibrate() (+39 more)

### Community 44 - "Community 44"
Cohesion: 0.09
Nodes (48): canvasArea(), buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS (+40 more)

### Community 45 - "Community 45"
Cohesion: 0.06
Nodes (40): app.check_edge_same_floor(), app.on_venue_created(), app.release_units_on_permanent_close(), app.touch_updated_at(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx, features_geom_idx (+32 more)

### Community 46 - "Community 46"
Cohesion: 0.09
Nodes (46): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, EDITOR_CAM, PUBLISH_BUTTON, unitCorner(), VALIDATE_BUTTON (+38 more)

### Community 47 - "Community 47"
Cohesion: 0.08
Nodes (39): applyEntitlements(), enabledFeatures(), FEATURE_LABELS, PAID_FEATURES, EMPTY_SNAPSHOT_GRAPH, snapshotGraphPath(), splitSnapshot(), hasBlockingFindings() (+31 more)

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (36): floors, gu, options, radiology, square, toilet, venueId, CategoryRow (+28 more)

### Community 49 - "Community 49"
Cohesion: 0.05
Nodes (48): dependencies, fflate@^0.8.3, @indoor/domain@workspace:*, @indoor/map-core@workspace:*, @indoor/routing@workspace:*, pdfjs-dist@catalog:, react@catalog:, react-router@catalog: (+40 more)

### Community 50 - "Community 50"
Cohesion: 0.05
Nodes (48): lucide-react@catalog:, @types/react-dom@catalog:, lucide-react, @types/react-dom, @types/react-dom@catalog:, lucide-react@catalog:, @types/react-dom@catalog:, lucide-react@catalog: (+40 more)

### Community 51 - "Community 51"
Cohesion: 0.09
Nodes (42): FloorUnit, FreeFloor, Pt, CONCOURSE, DRINK, FOOD, FOOTPRINT, GATES (+34 more)

### Community 52 - "Community 52"
Cohesion: 0.05
Nodes (47): devDependencies, @biomejs/biome@catalog:, @indoor/third-party-notices@workspace:*, @tailwindcss/vite@catalog:, @types/node@catalog:, @types/react@catalog:, typescript@catalog:, vite@catalog: (+39 more)

### Community 53 - "Community 53"
Cohesion: 0.09
Nodes (38): data, initialAuthRedirectHash, useVenueSelection, venuesKey, aliasesKey(), PROBLEM_MESSAGES, useAliasDraft(), livePreview() (+30 more)

### Community 54 - "Community 54"
Cohesion: 0.10
Nodes (36): useVisitorTour(), useMediaQuery(), Brand(), DESKTOP_QUERY, Logo(), MOBILE_HEADER_PX, moveCamera(), categoryIconSpecs() (+28 more)

### Community 55 - "Community 55"
Cohesion: 0.07
Nodes (27): BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap(), FULL_TOP_GAP_PX (+19 more)

### Community 56 - "Community 56"
Cohesion: 0.13
Nodes (34): OriginChooser(), OriginRow(), OriginTapHint(), useOriginName(), useOriginMap(), ClosureNotice(), FailureMessage(), RoutePanel() (+26 more)

### Community 57 - "Community 57"
Cohesion: 0.09
Nodes (28): app.check_unit_single_location(), location_units_single_location, public.categories, public.facility_types, public.features, public.field_definitions, public.location_categories, public.location_types (+20 more)

### Community 58 - "Community 58"
Cohesion: 0.06
Nodes (42): @indoor/data@workspace:*, @indoor/data@workspace:*, devDependencies, @biomejs/biome@catalog:, @indoor/data@workspace:*, @indoor/domain@workspace:*, @playwright/test@catalog:, @types/node@catalog: (+34 more)

### Community 59 - "Community 59"
Cohesion: 0.10
Nodes (29): downloadPdf(), downloadPng(), INSTRUCTIONS, qrFilename(), save(), A6_PT, contentStream(), fixed() (+21 more)

### Community 60 - "Community 60"
Cohesion: 0.07
Nodes (27): licenses_one_current, public.installation, public.licenses, app.license_active(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+19 more)

### Community 61 - "Community 61"
Cohesion: 0.05
Nodes (41): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+33 more)

### Community 62 - "Community 62"
Cohesion: 0.06
Nodes (31): ConnectorLinks, connector(), connectors, edge(), edges, escalatorDown, escalatorUp, GRAPH (+23 more)

### Community 63 - "Community 63"
Cohesion: 0.05
Nodes (38): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+30 more)

### Community 64 - "Community 64"
Cohesion: 0.06
Nodes (37): @biomejs/biome, typescript, dependencies, zod@catalog:, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog: (+29 more)

### Community 65 - "Community 65"
Cohesion: 0.08
Nodes (33): FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, ACTION_ROLES, ADMIN_ACTIONS (+25 more)

### Community 66 - "Community 66"
Cohesion: 0.06
Nodes (34): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+26 more)

### Community 67 - "Community 67"
Cohesion: 0.07
Nodes (24): app.trial_venue(), hosting.trials, hosting.blocklist, hosting.trial_requests, hosting.vendor_staff, public.hosting_request_get(), public.hosting_request_requeue(), public.hosting_request_verify() (+16 more)

### Community 68 - "Community 68"
Cohesion: 0.06
Nodes (37): @indoor/ui@workspace:*, react-dom@catalog:, @tanstack/react-query@catalog:, @indoor/ui, react-dom, @tanstack/react-query, dependencies, @indoor/data@workspace:* (+29 more)

### Community 69 - "Community 69"
Cohesion: 0.10
Nodes (27): toListItem(), EntranceLayer(), EntranceState, IDLE, useEntranceStore, EntrancesPanel(), suggest(), FeatureButton() (+19 more)

### Community 70 - "Community 70"
Cohesion: 0.08
Nodes (29): SnapshotConnector, SnapshotGeometry, SnapshotNavEdge, SnapshotNavNode, SnapshotOutdoorSubtype, SnapshotPolygon, SnapshotUnitStatus, SourceFeature (+21 more)

### Community 71 - "Community 71"
Cohesion: 0.15
Nodes (28): HOSTED_TRIAL_DAYS, NoticeEmail, renderAccountNotice(), AuthEmail, compose(), Params, BRAND_LOGO, EMAIL_LOGO (+20 more)

### Community 72 - "Community 72"
Cohesion: 0.10
Nodes (24): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, ensureStyle(), findTourTarget(), reducedMotion(), runTour(), TourEnd (+16 more)

### Community 73 - "Community 73"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 74 - "Community 74"
Cohesion: 0.10
Nodes (22): public.buildings, public.floors, public.info_points, public.origin_points, public.venues, app.guard_outdoor_layer(), floors_guard_outdoor_layer, app.enforce_quota() (+14 more)

### Community 75 - "Community 75"
Cohesion: 0.21
Nodes (34): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+26 more)

### Community 76 - "Community 76"
Cohesion: 0.13
Nodes (27): createForUnit(), editorQueues(), graphSaveQueue(), pickFacilityTypeId(), PropertiesPatch, saveQueue(), SHAPE_OF, UNIT_CODE_MESSAGES (+19 more)

### Community 77 - "Community 77"
Cohesion: 0.10
Nodes (14): appServers, args, CI, projectArgs, perfEnv, tls, Violation, median() (+6 more)

### Community 78 - "Community 78"
Cohesion: 0.09
Nodes (17): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+9 more)

### Community 79 - "Community 79"
Cohesion: 0.06
Nodes (33): @types/node, bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+25 more)

### Community 80 - "Community 80"
Cohesion: 0.11
Nodes (27): geometryOf(), RouteLayer(), FOCUS_MIN_ZOOM, focusFeature(), focusZoom(), geometryBounds(), prefersReducedMotion(), appliedColors (+19 more)

### Community 81 - "Community 81"
Cohesion: 0.10
Nodes (28): requestTrial(), en, id, TRIAL_COPY, TrialCopy, Field(), Problems, State (+20 more)

### Community 82 - "Community 82"
Cohesion: 0.06
Nodes (31): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+23 more)

### Community 83 - "Community 83"
Cohesion: 0.11
Nodes (24): areaM2(), polygonAreaM2(), ringAreaM2(), roundAreaM2(), LinearRingSchema, LineString, LineStringSchema, MultiPolygonSchema (+16 more)

### Community 84 - "Community 84"
Cohesion: 0.16
Nodes (30): attachAt(), clamp01(), closestBetween(), firstPosition(), inside(), LinkTargets, linkTargets(), nearestOnGraph() (+22 more)

### Community 85 - "Community 85"
Cohesion: 0.07
Nodes (31): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+23 more)

### Community 86 - "Community 86"
Cohesion: 0.13
Nodes (27): DisplayFormErrors, DisplayFormValues, HEIGHT_MESSAGES, number, settings, toFormValues(), toPatch(), validate() (+19 more)

### Community 87 - "Community 87"
Cohesion: 0.12
Nodes (27): EditorState, TOOLS, Connector, CONNECTORS, CORRIDORS, DESTINATION, DESTINATION_UNIT, FLOOR_D (+19 more)

### Community 88 - "Community 88"
Cohesion: 0.11
Nodes (10): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), checkTable(), IMPORT_HEADER, shot(), openAuditTab() (+2 more)

### Community 89 - "Community 89"
Cohesion: 0.09
Nodes (15): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, AuthRepository, EMAIL_UNAVAILABLE_PREFIXES (+7 more)

### Community 90 - "Community 90"
Cohesion: 0.17
Nodes (22): CustomField, PictogramKey, airportStation, campus, custom, factoryWarehouse, hospital, hours (+14 more)

### Community 91 - "Community 91"
Cohesion: 0.12
Nodes (24): LicenseRejection, InviteInput, inviteScope(), Role, ROLES, askVendor(), checkIn(), CheckinFailure (+16 more)

### Community 92 - "Community 92"
Cohesion: 0.15
Nodes (26): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+18 more)

### Community 93 - "Community 93"
Cohesion: 0.13
Nodes (13): Entry, GraphChangesInput, GraphSaveQueue, GraphSaveQueueOptions, deferred(), setup(), venue, toChanges() (+5 more)

### Community 94 - "Community 94"
Cohesion: 0.13
Nodes (24): BuildingType, slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, hoursRows(), point() (+16 more)

### Community 95 - "Community 95"
Cohesion: 0.08
Nodes (28): tailwindcss@catalog:, tailwindcss, tailwindcss@catalog:, tailwindcss@catalog:, devDependencies, @biomejs/biome@catalog:, tailwindcss@catalog:, @types/node@catalog: (+20 more)

### Community 96 - "Community 96"
Cohesion: 0.16
Nodes (24): inVenueTime(), OUTDOOR, ActiveVersion(), kilobytes(), PublishButton(), VenuePublish(), activePublicationKey(), historyKey() (+16 more)

### Community 97 - "Community 97"
Cohesion: 0.11
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 98 - "Community 98"
Cohesion: 0.11
Nodes (21): RouteEnd, ENTRANCES, FeatureParts, featureTarget(), infoPointTarget(), LocationParts, locationTarget(), originPointTarget() (+13 more)

### Community 99 - "Community 99"
Cohesion: 0.16
Nodes (21): EntranceField(), ANCHOR_OWNERS, Facts(), GraphProperties(), meters(), NODE_ROLE_LABELS, FEATURE_KIND_LABELS, CommitInput() (+13 more)

### Community 100 - "Community 100"
Cohesion: 0.15
Nodes (21): colorNotes(), empty, channel(), contrastRatio(), parseHex(), readableTextOn(), relativeLuminance(), WCAG_AA_TEXT (+13 more)

### Community 101 - "Community 101"
Cohesion: 0.20
Nodes (24): IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings(), byFloor(), finding() (+16 more)

### Community 102 - "Community 102"
Cohesion: 0.23
Nodes (17): currentGraph(), GraphActions, useGraphActions(), setEdgeAccessible(), addEntrance(), applyEntrances(), linkEntrance(), removeEntrancesOf() (+9 more)

### Community 103 - "Community 103"
Cohesion: 0.14
Nodes (22): combinedSave(), EditorPatch, EMPTY_GRAPH, GRAPH_SHOWN, GRAPH_TOOLS, IDLE, SaveSource, floorId (+14 more)

### Community 104 - "Community 104"
Cohesion: 0.09
Nodes (16): NON_RETRYABLE, queryClient, LanguagePicker(), applyVenueLanguage(), initial, readStoredLanguage(), setLanguage(), rootElement (+8 more)

### Community 105 - "Community 105"
Cohesion: 0.14
Nodes (20): RFC-2045, RFC-2387, addressOf(), base64(), base64Lines(), buildMessage(), Conn, connect() (+12 more)

### Community 106 - "Community 106"
Cohesion: 0.08
Nodes (26): dependencies, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+18 more)

### Community 107 - "Community 107"
Cohesion: 0.08
Nodes (26): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+18 more)

### Community 108 - "Community 108"
Cohesion: 0.17
Nodes (22): at(), CATEGORY_ID, DENSE_FLOOR, FACILITY_TYPE_ID, floorFeatures(), FloorGraph, floorGraph(), floorName() (+14 more)

### Community 109 - "Community 109"
Cohesion: 0.12
Nodes (20): move(), FACILITY_TYPE_NAME_MAX, FacilityIcon, FacilityIconFileCheck, FacilityIconFileProblem, FacilityIconFormat, FacilityTypeNameProblem, ICON_EXTENSION (+12 more)

### Community 110 - "Community 110"
Cohesion: 0.12
Nodes (21): takenMessage(), UnitLinks(), add(), addTyped(), onKeyDown(), IMPORT_STANDARD_COLUMNS, ImportPlan, ImportRow (+13 more)

### Community 111 - "Community 111"
Cohesion: 0.15
Nodes (20): BASEMAP_MESSAGES, orNull(), SystemFormErrors, SystemFormValues, base, toPatch(), URL_MESSAGES, validate() (+12 more)

### Community 112 - "Community 112"
Cohesion: 0.21
Nodes (19): along(), anchored(), cross(), crossing(), EMPTY_PATCH, GraphChange, lerp(), nearestNode() (+11 more)

### Community 113 - "Community 113"
Cohesion: 0.12
Nodes (15): public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), public.publish_begin(), public.publish_commit(), public.acquire_edit_lock() (+7 more)

### Community 114 - "Community 114"
Cohesion: 0.29
Nodes (7): CONTEXT, VENUES, concertVenue(), rect(), hospitalVenue(), mallVenue(), officeVenue()

### Community 115 - "Community 115"
Cohesion: 0.17
Nodes (18): newToken(), sha256Hex(), toBase64Url(), trialEnv(), trialSmtpConfig(), TRIAL_ENDED, activate(), Activation (+10 more)

### Community 116 - "Community 116"
Cohesion: 0.15
Nodes (6): _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 117 - "Community 117"
Cohesion: 0.33
Nodes (4): airportVenue(), VenueBuilder, campusVenue(), factoryVenue()

### Community 118 - "Community 118"
Cohesion: 0.12
Nodes (16): accepted(), claim(), logError(), NoticeRow, release(), text(), HookPayload, renderAuthEmail() (+8 more)

### Community 119 - "Community 119"
Cohesion: 0.14
Nodes (18): FIELD_PROBLEM_MESSAGES, useTypeChoice(), change(), lostOnChange(), customFieldInput(), CustomFieldProblem, customFieldsSchema(), FIELD_LABEL_MAX (+10 more)

### Community 120 - "Community 120"
Cohesion: 0.25
Nodes (18): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+10 more)

### Community 121 - "Community 121"
Cohesion: 0.13
Nodes (12): currentValidUntil(), LICENSE_ID, newDb(), signIn(), sql(), callLifecycle(), lifecycle(), lifecycleSecret() (+4 more)

### Community 122 - "Community 122"
Cohesion: 0.18
Nodes (20): canvas2d(), drawBadge(), drawGlyph(), drawPlaceholderGlyph(), FACILITY_ICON_COLORS, FACILITY_ICON_FALLBACK, FACILITY_ICON_PREFIX, FacilityIconSpec (+12 more)

### Community 123 - "Community 123"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 124 - "Community 124"
Cohesion: 0.24
Nodes (17): DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds(), routeViewOn(), stepTexts(), targetName() (+9 more)

### Community 125 - "Community 125"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 126 - "Community 126"
Cohesion: 0.12
Nodes (14): public.edit_locks, app.floor_writable(), public.release_edit_lock(), public.take_over_edit_lock(), public.take_over_edit_lock(), app.can_write_floor(), app.can_write_location(), app.can_write_location_type() (+6 more)

### Community 127 - "Community 127"
Cohesion: 0.17
Nodes (17): BrandingFormErrors, BrandingFormValues, ColorNote, MESSAGES, ratio, Branding, BRANDING_KEYS, BrandingInput (+9 more)

### Community 128 - "Community 128"
Cohesion: 0.24
Nodes (15): home(), LanguageSwitch(), privacyPage(), SiteFooter(), SiteHeader(), useDocumentMeta(), PAGES, root (+7 more)

### Community 129 - "Community 129"
Cohesion: 0.17
Nodes (10): contrastOn(), enableAutoTours(), luminance(), resetTourProgress(), TourPopover, tourProgress(), openLocations(), openEditorAs() (+2 more)

### Community 130 - "Community 130"
Cohesion: 0.10
Nodes (19): runs-on, steps, concurrency, cancel-in-progress, group, jobs, check, name (+11 more)

### Community 131 - "Community 131"
Cohesion: 0.11
Nodes (19): @types/geojson@catalog:, @types/geojson, devDependencies, @biomejs/biome@catalog:, @types/geojson@catalog:, typescript@catalog:, vitest@catalog:, exports (+11 more)

### Community 132 - "Community 132"
Cohesion: 0.22
Nodes (18): BasemapUrlProblem, checkBasemapTileUrl(), escapeAttribution(), LOCAL_HOSTS, ParsedUrl, installation(), num(), numOrNull() (+10 more)

### Community 133 - "Community 133"
Cohesion: 0.14
Nodes (17): ComponentSummary, graphComponents(), isolatedNodeIds(), NO_OTHERS, smallestId(), summarizeComponents(), unionFind(), BASE (+9 more)

### Community 134 - "Community 134"
Cohesion: 0.16
Nodes (17): applyGraphPatch(), edgeLengthM(), NAV_NODE_ROLES, NavNodeRole, apply(), BASE, degree(), draw() (+9 more)

### Community 135 - "Community 135"
Cohesion: 0.18
Nodes (16): [product, nodeModules], authorOf(), collectNotices(), ExtraNotice, label(), licenseOf(), Notice, NOTICES_FILE (+8 more)

### Community 136 - "Community 136"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+11 more)

### Community 137 - "Community 137"
Cohesion: 0.14
Nodes (11): ConnectorDialogState, OriginPointDraft, Connector, CONNECTOR_KINDS, CONNECTOR_NAME_MAX, ConnectorFloor, ConnectorProblem, ESCALATOR_DIRECTIONS (+3 more)

### Community 138 - "Community 138"
Cohesion: 0.12
Nodes (16): saveValid(), { chromium }, envFile, locationId(), OUT, require, rest(), root (+8 more)

### Community 139 - "Community 139"
Cohesion: 0.17
Nodes (17): ChangeSummary(), count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), CHANGE_GROUPS (+9 more)

### Community 140 - "Community 140"
Cohesion: 0.14
Nodes (12): ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paperGrid(), paths (+4 more)

### Community 141 - "Community 141"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 142 - "Community 142"
Cohesion: 0.24
Nodes (14): useVenueGraph(), NONE, NOTHING_CLOSED, otherFloors(), useGraphStatus(), useNow(), instructionTemplatesKey(), useInfoPoints() (+6 more)

### Community 143 - "Community 143"
Cohesion: 0.14
Nodes (12): app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, app.server_settings, app.sync_service(), app.hosting_mode() (+4 more)

### Community 144 - "Community 144"
Cohesion: 0.12
Nodes (17): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, exports, vite (+9 more)

### Community 145 - "Community 145"
Cohesion: 0.21
Nodes (12): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+4 more)

### Community 146 - "Community 146"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 147 - "Community 147"
Cohesion: 0.14
Nodes (10): createLocationTypesRepository(), FieldRow, LocationTypesRepository, mapFieldRow(), mapLocationTypeRow(), toFieldRow(), TypeRow, field (+2 more)

### Community 148 - "Community 148"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 149 - "Community 149"
Cohesion: 0.14
Nodes (3): EditorState, Direction, EditorTool

### Community 150 - "Community 150"
Cohesion: 0.15
Nodes (12): Demo(), DemoBoundary, DemoMap, DEMO_URL, OUTCOMES, pending, postVerify(), RequestResult (+4 more)

### Community 151 - "Community 151"
Cohesion: 0.12
Nodes (16): condition, auth, storage, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD, PGUSER (+8 more)

### Community 152 - "Community 152"
Cohesion: 0.21
Nodes (12): dc(), die(), fetch_images(), health_check(), health_once(), load_env(), migration_count(), psql_db() (+4 more)

### Community 153 - "Community 153"
Cohesion: 0.26
Nodes (12): isEulaVersion(), needsEulaAcceptance(), ActivationError, createFirstAdmin(), eulaToRecord(), fromVendor(), handle(), install() (+4 more)

### Community 154 - "Community 154"
Cohesion: 0.30
Nodes (15): addNoise(), addTone(), bass(), CHORDS, duckGain(), kick(), midi(), mixdown() (+7 more)

### Community 155 - "Community 155"
Cohesion: 0.17
Nodes (11): app.enforce_publish_per_day(), app.enforce_quota(), app.enforce_storage_quota(), app.license_is_trial(), features_quota, locations_quota, objects_license_quota, origin_points_quota (+3 more)

### Community 156 - "Community 156"
Cohesion: 0.26
Nodes (5): SaveOp, SaveQueue, SaveQueueOptions, deferred(), setup()

### Community 158 - "Community 158"
Cohesion: 0.19
Nodes (11): Db, DEMO_USERS, demoClosures(), demoEmail(), DemoUser, hoursFromNow(), RELEASE_NOTES, seedDemoUsers() (+3 more)

### Community 159 - "Community 159"
Cohesion: 0.14
Nodes (4): app.enforce_quota(), app.quota_limit(), app.quota_venue(), venue_members_quota

### Community 160 - "Community 160"
Cohesion: 0.26
Nodes (12): WithTooltip(), EditorToolbar(), HistoryButton(), TOOLS, isTyping(), TOOL_BY_KEY, TOOL_SHORTCUTS, UNDO_SHORTCUT (+4 more)

### Community 161 - "Community 161"
Cohesion: 0.24
Nodes (11): drawKindLabel(), drawKindValue(), OUTDOOR_SUBTYPE_LABELS, UNIT_STATUS_LABELS, KindPicker(), choose(), defaultDrawKinds(), DrawKind (+3 more)

### Community 162 - "Community 162"
Cohesion: 0.24
Nodes (9): SearchField(), useDebouncedValue(), SEARCH_DEBOUNCE_MS, SEARCH_RESULTS_ID, VenueSearch(), onKeyDown(), submit(), OnScreenKeyboard() (+1 more)

### Community 163 - "Community 163"
Cohesion: 0.17
Nodes (13): environment, image, restart, ALLOWED_ORIGINS, JWT_SECRET, LICENSE_VENDOR_URL, SEND_EMAIL_HOOK_SECRET, SUPABASE_ANON_KEY (+5 more)

### Community 164 - "Community 164"
Cohesion: 0.15
Nodes (13): ADMIN_DOMAIN, API_DOMAIN, PANDUARAH_ANON_KEY, PANDUARAH_API_URL, TLS_DIRECTIVE, VISITOR_DOMAIN, web, depends_on (+5 more)

### Community 165 - "Community 165"
Cohesion: 0.15
Nodes (13): ANON_KEY, AUTH_JWT_SECRET, DATABASE_URL, ENABLE_IMAGE_TRANSFORMATION, FILE_SIZE_LIMIT, FILE_STORAGE_BACKEND_PATH, GLOBAL_S3_BUCKET, POSTGREST_URL (+5 more)

### Community 166 - "Community 166"
Cohesion: 0.31
Nodes (12): ask(), assert_env_version(), assert_own_hook_secret(), b64url(), check_prerequisites(), install_backup_schedule(), jwt(), main() (+4 more)

### Community 167 - "Community 167"
Cohesion: 0.19
Nodes (7): AIRLINES, FOOD, RETAIL, BuiltFloor, dailyHours(), stableUuid(), mall()

### Community 168 - "Community 168"
Cohesion: 0.17
Nodes (8): dependencies, @indoor/domain@workspace:*, maplibre-gl@catalog:, terra-draw@catalog:, terra-draw-maplibre-gl-adapter@catalog:, PolygonDrawer, terra-draw, terra-draw-maplibre-gl-adapter

### Community 169 - "Community 169"
Cohesion: 0.15
Nodes (8): connectors, edges, graph, hall, nodes, now, options, square

### Community 170 - "Community 170"
Cohesion: 0.32
Nodes (9): downloadCsvTemplate(), downloadXlsxTemplate(), save(), slug(), RFC-4180, guessDelimiter(), parseCsv(), toCsv() (+1 more)

### Community 171 - "Community 171"
Cohesion: 0.17
Nodes (11): name, services, storage, image, restart, volumes, volumes, caddy-config (+3 more)

### Community 172 - "Community 172"
Cohesion: 0.17
Nodes (12): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, depends_on (+4 more)

### Community 173 - "Community 173"
Cohesion: 0.21
Nodes (9): createVariedVenues(), specs(), VenueSpec, checkCustomField(), VENUE_TEMPLATES, VenueTemplateSchema, VENUE_TYPES, VenueInputProblem (+1 more)

### Community 174 - "Community 174"
Cohesion: 0.24
Nodes (3): ConversionError, render_svg(), RenderTest

### Community 175 - "Community 175"
Cohesion: 0.23
Nodes (9): hhmm(), isOpenAt(), localParts(), minutes(), OpeningHoursProblem, OpeningSpan, shiftDate(), spansOn() (+1 more)

### Community 176 - "Community 176"
Cohesion: 0.17
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 177 - "Community 177"
Cohesion: 0.18
Nodes (8): admin(), anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 178 - "Community 178"
Cohesion: 0.20
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 179 - "Community 179"
Cohesion: 0.38
Nodes (9): columnIndex(), columnName(), escapeXml(), firstSheetPath(), readXlsx(), texts(), unescapeXml(), writeXlsx() (+1 more)

### Community 180 - "Community 180"
Cohesion: 0.18
Nodes (6): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT

### Community 181 - "Community 181"
Cohesion: 0.25
Nodes (10): mapDisplaySettingsRow(), CameraView, CameraViewSchema, DISPLAY_MODES, HeightSchema, isRecord(), MAX_HEIGHT_M, parseCamera() (+2 more)

### Community 182 - "Community 182"
Cohesion: 0.33
Nodes (6): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText()

### Community 184 - "Community 184"
Cohesion: 0.20
Nodes (10): depends_on, image, restart, condition, db, rest, depends_on, condition (+2 more)

### Community 185 - "Community 185"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 187 - "Community 187"
Cohesion: 0.36
Nodes (6): closureMarks(), knownClosures(), useClosureMap(), CLOSURE_REFRESH_MS, closuresQuery(), useLiveClosures()

### Community 188 - "Community 188"
Cohesion: 0.42
Nodes (5): useVenueBranding(), snapshot, VenueBrand, venueBrand(), brandDisplayName()

### Community 189 - "Community 189"
Cohesion: 0.22
Nodes (9): command, environment, image, restart, volumes, PGPORT, POSTGRES_DB, POSTGRES_PASSWORD (+1 more)

### Community 190 - "Community 190"
Cohesion: 0.22
Nodes (3): baseline, pg_temp.current(), pg_temp.requests()

### Community 191 - "Community 191"
Cohesion: 0.33
Nodes (7): ConnectorInput, ConnectorRow, isDirection(), isKind(), mapConnectorRow(), row, ConnectorDraft

### Community 192 - "Community 192"
Cohesion: 0.36
Nodes (5): PICTOGRAM_KEYS, partAttributes(), Pictogram(), PICTOGRAM_SHAPES, PictogramPart

### Community 193 - "Community 193"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../tsconfig.base.json

### Community 194 - "Community 194"
Cohesion: 0.36
Nodes (3): license_of(), license_text(), main()

### Community 195 - "Community 195"
Cohesion: 0.38
Nodes (6): count, GraphLegend(), ITEMS, LegendStyle, Swatch(), VisibilityToggle()

### Community 196 - "Community 196"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 197 - "Community 197"
Cohesion: 0.43
Nodes (5): apply(), saved(), systemDark(), Theme, ThemeToggle()

### Community 198 - "Community 198"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 199 - "Community 199"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 201 - "Community 201"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 202 - "Community 202"
Cohesion: 0.33
Nodes (4): restore.sh script, rollback.sh script, rollback(), upgrade.sh script

### Community 203 - "Community 203"
Cohesion: 0.33
Nodes (5): ALL, capture(), MENUS, shot(), WITHOUT_ADMIN_ONLY

### Community 204 - "Community 204"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 205 - "Community 205"
Cohesion: 0.29
Nodes (3): BASE, corridor, empty

### Community 206 - "Community 206"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 207 - "Community 207"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 208 - "Community 208"
Cohesion: 0.33
Nodes (6): aliases, image, networks, restart, default, functions

### Community 209 - "Community 209"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

### Community 210 - "Community 210"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 211 - "Community 211"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 212 - "Community 212"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 213 - "Community 213"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 215 - "Community 215"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 216 - "Community 216"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 217 - "Community 217"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 218 - "Community 218"
Cohesion: 0.33
Nodes (5): vulnerabilities, expired_at, id, purls, statement

### Community 219 - "Community 219"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 220 - "Community 220"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 221 - "Community 221"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 222 - "Community 222"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

## Knowledge Gaps
- **5 isolated node(s):** `RFC-2045`, `RFC-2387`, `TARGETS`, `RFC-4180`, `RFC-6238`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2337 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-i18next` connect `Community 30` to `Community 0`, `Community 162`, `Community 72`, `Community 104`, `Community 49`, `Community 20`, `Community 21`, `Community 54`, `Community 55`, `Community 24`, `Community 56`, `Community 31`, `Community 95`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `RFC-2045`, `RFC-2387`, `TARGETS` to the rest of the system?**
  _5 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05185317177476835 - nodes in this community are weakly interconnected._
- **Why does `VenueId` connect `Community 16` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 7`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 142`, `Community 18`, `Community 147`, `Community 20`, `Community 21`, `Community 24`, `Community 25`, `Community 28`, `Community 29`, `Community 158`, `Community 31`, `Community 36`, `Community 40`, `Community 41`, `Community 173`, `Community 48`, `Community 53`, `Community 181`, `Community 187`, `Community 191`, `Community 76`, `Community 205`, `Community 78`, `Community 84`, `Community 86`, `Community 93`, `Community 96`, `Community 109`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03238993710691824 - nodes in this community are weakly interconnected._
- **Why does `Button()` connect `Community 0` to `Community 128`, `Community 2`, `Community 5`, `Community 7`, `Community 9`, `Community 10`, `Community 139`, `Community 18`, `Community 20`, `Community 21`, `Community 150`, `Community 24`, `Community 30`, `Community 31`, `Community 33`, `Community 36`, `Community 41`, `Community 53`, `Community 56`, `Community 69`, `Community 197`, `Community 80`, `Community 81`, `Community 86`, `Community 96`, `Community 99`, `Community 110`, `Community 120`, `Community 124`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03438132009560581 - nodes in this community are weakly interconnected._