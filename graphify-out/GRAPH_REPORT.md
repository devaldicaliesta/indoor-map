# Graph Report - indoor-map  (2026-11-15)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 8544 nodes · 27045 edges · 301 communities (221 shown, 80 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 399 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12dedc87`
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
- Community 223
- Community 224
- Community 225
- Community 226
- Community 228
- Community 229
- Community 231
- Community 232
- Community 233
- Community 234
- Community 235
- Community 236
- Community 237
- Community 238
- Community 242
- Community 245
- Community 246
- Community 247
- Community 248
- Community 249
- Community 250
- Community 251
- Community 255

## God Nodes (most connected - your core abstractions)
1. `Button()` - 287 edges
2. `VenueId` - 192 edges
3. `cn()` - 145 edges
4. `Input()` - 121 edges
5. `test` - 110 edges
6. `createRepositories()` - 99 edges
7. `toDataError()` - 98 edges
8. `FormNotice()` - 90 edges
9. `DataError` - 89 edges
10. `Skeleton()` - 87 edges

## Surprising Connections (you probably didn't know these)
- `VenueSpec` --references--> `VenueType`  [EXTRACTED]
  e2e/support/varied-venues.ts → packages/domain/src/venue.ts
- `Demo` --references--> `Venue`  [EXTRACTED]
  e2e/tests/visitor/verify/T-320-demo-venues.spec.ts → packages/domain/src/venue.ts
- `Attempt` --references--> `DataClient`  [EXTRACTED]
  e2e/support/role-attempts.ts → packages/data/src/client.ts
- `FloorTarget` --references--> `BuildingId`  [EXTRACTED]
  apps/admin/src/features/venues/floors/queries.ts → packages/domain/src/ids.ts
- `ClosureMarkData` --references--> `SnapshotPosition`  [EXTRACTED]
  apps/visitor/src/features/closures/closure-model.ts → packages/domain/src/snapshot.ts

## Import Cycles
- None detected.

## Communities (301 total, 80 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (164): ContrastTable(), readToken(), SURFACES, TEXT_PAIRS, TOKENS, UiGalleryPage(), AccountMenu(), Providers() (+156 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (50): submit(), Fixtures, FOOTPRINT, linkUnitsToPath(), test, TEST_CENTER, TestVenue, unitSquare() (+42 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (132): ColorField(), isColorValue(), Field(), AliasField(), FormNotice(), ForgotPasswordPage(), floorLabel(), ConnectorDialog() (+124 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (97): createRepositories(), DataClientConfig, CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums (+89 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (110): placeText(), UNIT_STATUS_TEXT, takenMessage(), UnitLinks(), add(), addTyped(), onKeyDown(), UnitSelection (+102 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (106): createAuthRepository(), signOut(), CODE_RULES, CodeRule, DataError, DataErrorKind, DEFAULT_MESSAGES, HTTP_RULES (+98 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (105): submit(), haversineM(), SnapshotGraph, SnapshotPosition, ARC_ACCESSIBLE, ARC_CONNECTOR, ArcDraft, ConnectorArcs (+97 more)

### Community 7 - "Community 7"
Cohesion: 0.04
Nodes (110): Can(), GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), useCurrentProfile(), DataTableGallery(), HomeRedirect() (+102 more)

### Community 8 - "Community 8"
Cohesion: 0.04
Nodes (110): COLUMNS, date, DEMO_STATES, DemoState, FILTERS, FLOORS, NAMES, Room (+102 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (105): aliasesKey(), PROBLEM_MESSAGES, useAliasDraft(), UnitLocation(), ACTION_LABELS, ImportDialog(), choose(), PLAN_COLUMNS (+97 more)

### Community 10 - "Community 10"
Cohesion: 0.04
Nodes (87): currentProfileKey, useAuthSync(), RequireAuth(), data, initialAuthRedirectHash, useVenueSelection, venuesKey, AuthLayout() (+79 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (65): CONTEXT, VENUES, AIRLINES, airportVenue(), FOOD, RETAIL, BuildingSpec, BuiltBuilding (+57 more)

### Community 12 - "Community 12"
Cohesion: 0.03
Nodes (84): base, snapshot, facility, index, snapshot, index, snapshot, at() (+76 more)

### Community 13 - "Community 13"
Cohesion: 0.04
Nodes (98): InsertedVenue, byId(), LocationPlace, Place, SnapshotIndex, PolygonSchema, PositionSchema, hasOpeningHours() (+90 more)

### Community 14 - "Community 14"
Cohesion: 0.05
Nodes (42): RFC-6238, env, envFile, createHostedTrial(), endHostedTrial(), HostedTrialUser, removeHostedTrial(), currentLicenseId() (+34 more)

### Community 15 - "Community 15"
Cohesion: 0.03
Nodes (38): VenueSelection, DataClient, Page, PageQuery, AliasesRepository, BuildingsRepository, ClosuresRepository, ConnectorsRepository (+30 more)

### Community 16 - "Community 16"
Cohesion: 0.03
Nodes (62): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, AuthRepository, EMAIL_UNAVAILABLE_PREFIXES (+54 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (84): loadCrowd(), SnapshotNodeRole, areaSpots(), arrive(), between(), blankPerson(), buildNets(), createCrowd() (+76 more)

### Community 18 - "Community 18"
Cohesion: 0.03
Nodes (57): page, json(), read(), results, root, DESKTOP, repoRoot, repoRoot (+49 more)

### Community 19 - "Community 19"
Cohesion: 0.06
Nodes (74): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+66 more)

### Community 20 - "Community 20"
Cohesion: 0.05
Nodes (76): signedLicense(), paidLicense(), canonicalize(), fromBase64(), importLicensePublicKey(), isCount(), isDate(), isText() (+68 more)

### Community 21 - "Community 21"
Cohesion: 0.04
Nodes (49): Tables, TablesUpdate, zeroRowsError(), createDisplaySettingsRepository(), DisplaySettingsRow, toDisplaySettingsUpdate(), createFacilityTypesRepository(), inUseError() (+41 more)

### Community 22 - "Community 22"
Cohesion: 0.04
Nodes (77): dependencies, fflate@^0.8.3, @indoor/domain@workspace:*, @indoor/map-core@workspace:*, @indoor/routing@workspace:*, @indoor/ui@workspace:*, lucide-react@catalog:, pdfjs-dist@catalog: (+69 more)

### Community 23 - "Community 23"
Cohesion: 0.04
Nodes (41): floorId, target, settings, submit(), zod@catalog:, checkBuildingInput(), decodeDeepLink(), DEEP_LINK_COORDINATE_DECIMALS (+33 more)

### Community 24 - "Community 24"
Cohesion: 0.06
Nodes (60): ClosurePlaces, ConnectorPanel(), ANCHOR_OWNERS, Facts(), GraphProperties(), meters(), drawKindLabel(), drawKindValue() (+52 more)

### Community 25 - "Community 25"
Cohesion: 0.06
Nodes (62): FeatureKind, DEFAULT_FILL, DEFAULT_HEIGHTS, DEFAULT_OUTLINE, MAP_BACKGROUND, OUTDOOR_SUBTYPE_FILL, PITCH_3D, POINT_COLOR (+54 more)

### Community 26 - "Community 26"
Cohesion: 0.09
Nodes (58): EntityIcon(), ListRow(), FacilityDetail(), Missing(), UnitDetail(), FieldValue(), LocationProfile(), Places() (+50 more)

### Community 27 - "Community 27"
Cohesion: 0.08
Nodes (57): content(), dateText(), dateTimeText(), NoticeDetails, NoticeEmail, renderAccountNotice(), sentence(), unsubscribeUrl() (+49 more)

### Community 28 - "Community 28"
Cohesion: 0.06
Nodes (51): ConnectorFormBody(), submit(), ConnectorDialogState, useConnectorDialog, changeKind(), CONNECTOR_KIND_LABELS, CONNECTOR_PROBLEM_MESSAGES, ConnectorForm (+43 more)

### Community 29 - "Community 29"
Cohesion: 0.08
Nodes (56): DemoRouteOptions, ClosureMarkData, closureMarks(), useClosureMap(), CameraPadding, fitBearing(), focusCamera(), InitialCamera (+48 more)

### Community 30 - "Community 30"
Cohesion: 0.07
Nodes (55): PanelMessage(), MapArea(), VisitorShell(), data, graphQuery(), loadSnapshot(), loadSnapshotWithGraph(), snapshotKey() (+47 more)

### Community 31 - "Community 31"
Cohesion: 0.06
Nodes (54): app.check_edge_same_floor(), app.on_venue_created(), app.touch_updated_at(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx, features_geom_idx, features_unit_code_unique (+46 more)

### Community 32 - "Community 32"
Cohesion: 0.11
Nodes (52): others, TimezoneSelect(), VenuePicker(), AREA_KINDS, targetKey(), TargetPicker(), FloorFields(), FloorSelect() (+44 more)

### Community 33 - "Community 33"
Cohesion: 0.07
Nodes (49): useConnectors(), EntranceField(), EntranceLayer(), EntranceState, IDLE, useEntranceStore, EntrancesPanel(), suggest() (+41 more)

### Community 34 - "Community 34"
Cohesion: 0.07
Nodes (53): BasemapUrlProblem, checkBasemapTileUrl(), escapeAttribution(), LOCAL_HOSTS, ParsedUrl, applyEntitlements(), EMPTY_SNAPSHOT_GRAPH, snapshotGraphPath() (+45 more)

### Community 35 - "Community 35"
Cohesion: 0.06
Nodes (49): BrandGallery(), Section(), AppLayout(), NarrowScreenNotice(), subscribe(), NavItem(), Sidebar(), SidebarState (+41 more)

### Community 36 - "Community 36"
Cohesion: 0.07
Nodes (55): areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, checkPolygon(), duplicateCodeIssues(), GEOMETRY_ISSUE_CODES, GeometryIssueCode (+47 more)

### Community 37 - "Community 37"
Cohesion: 0.06
Nodes (42): Georeferencer, LngLat, createGraphInteractions(), onMove(), onUp(), preview(), snapped(), GraphInteractionOptions (+34 more)

### Community 38 - "Community 38"
Cohesion: 0.06
Nodes (51): copy(), BPM, Copy, COPY, EN, ID, SCENES, assets (+43 more)

### Community 39 - "Community 39"
Cohesion: 0.06
Nodes (45): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+37 more)

### Community 40 - "Community 40"
Cohesion: 0.07
Nodes (40): FOCUS_MIN_ZOOM, focusFeature(), focusZoom(), geometryBounds(), getCamera(), prefersReducedMotion(), Corners, attributed (+32 more)

### Community 41 - "Community 41"
Cohesion: 0.08
Nodes (46): EditorSidebar(), ListTab, useNow(), PlaceDisplay, PlaceField(), choose(), onKeyDown(), floorText() (+38 more)

### Community 42 - "Community 42"
Cohesion: 0.07
Nodes (46): targetOfPick(), featureName(), featurePosition(), featureView(), placeOfTarget(), tapFloorId(), RouteFailure, routeFailure() (+38 more)

### Community 43 - "Community 43"
Cohesion: 0.07
Nodes (44): InstructionErrors, SAMPLE, SAMPLE_FLOOR, validateInstruction(), distanceM(), INSTRUCTION_ACTION_LABELS, InstructionAction, InstructionText (+36 more)

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (49): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+41 more)

### Community 45 - "Community 45"
Cohesion: 0.10
Nodes (47): resize(), FALLBACK_CENTER, footprintBox(), loadImageSize(), Measure, startingPlacement(), useGeoreference(), calibrate() (+39 more)

### Community 46 - "Community 46"
Cohesion: 0.07
Nodes (38): RFC-2045, RFC-2387, accepted(), claim(), logError(), NoticeRow, release(), text() (+30 more)

### Community 47 - "Community 47"
Cohesion: 0.05
Nodes (32): LicenseRepository, FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, PaidFeature (+24 more)

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (35): licenses_one_current, public.installation, public.licenses, app.license_active(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+27 more)

### Community 49 - "Community 49"
Cohesion: 0.05
Nodes (50): devDependencies, @biomejs/biome@catalog:, @indoor/third-party-notices@workspace:*, tailwindcss@catalog:, @types/node@catalog:, @types/react@catalog:, typescript@catalog:, vite@catalog: (+42 more)

### Community 50 - "Community 50"
Cohesion: 0.06
Nodes (28): COORDINATE_DECIMALS, createFeatureEditor(), onClick(), drawStyles(), EditableFeature, editableFlags(), FeatureEditor, FeatureEditorCallbacks (+20 more)

### Community 51 - "Community 51"
Cohesion: 0.06
Nodes (20): TestRouteState, SheetSnap, closure(), createExploreStore(), ExploreState, FocusMode, INITIAL, InitialExplore (+12 more)

### Community 52 - "Community 52"
Cohesion: 0.08
Nodes (28): LoginPage, InvitedUser, inviteUser(), Mail, MailpitDetail, MailpitSummary, search(), waitForMail() (+20 more)

### Community 53 - "Community 53"
Cohesion: 0.06
Nodes (34): app.user_role(), public.profiles, app.hook_password_verification_attempt(), app.guard_last_super_admin(), app.log_profile_changes(), profiles_guard_last_super_admin, profiles_log_changes, app.revoke_sessions_on_deactivate() (+26 more)

### Community 54 - "Community 54"
Cohesion: 0.07
Nodes (22): ACCOUNTS, PublishedVenue, globalSetup(), Attempt, RoleTargets, SERVER_ATTEMPTS, SQUARE, capture() (+14 more)

### Community 55 - "Community 55"
Cohesion: 0.05
Nodes (44): @types/react-dom@catalog:, @types/react-dom, @types/react-dom@catalog:, @types/react-dom@catalog:, @types/react-dom@catalog:, dependencies, class-variance-authority@catalog:, clsx@catalog: (+36 more)

### Community 56 - "Community 56"
Cohesion: 0.07
Nodes (25): public.hosting_lifecycle_expired(), public.hosting_lifecycle_locked_venues(), public.hosting_lifecycle_purge(), public.hosting_queue_next(), public.license_service_state(), vendor.checkins, vendor.clients, vendor.installations (+17 more)

### Community 57 - "Community 57"
Cohesion: 0.05
Nodes (42): @indoor/data@workspace:*, @indoor/data@workspace:*, devDependencies, @biomejs/biome@catalog:, @indoor/data@workspace:*, @indoor/domain@workspace:*, @playwright/test@catalog:, @types/node@catalog: (+34 more)

### Community 58 - "Community 58"
Cohesion: 0.09
Nodes (37): DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds(), routeViewOn(), shownFloorOf(), stepTexts() (+29 more)

### Community 59 - "Community 59"
Cohesion: 0.08
Nodes (35): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT, MapLabel, hasLocationIcon (+27 more)

### Community 60 - "Community 60"
Cohesion: 0.12
Nodes (36): isoSeconds(), licensePayloadFor(), newLicenseId(), onPremTrialIssueRequest(), trialApprovalDaysProblem(), InviteInput, inviteScope(), Role (+28 more)

### Community 61 - "Community 61"
Cohesion: 0.08
Nodes (30): app.check_unit_single_location(), app.release_units_on_permanent_close(), location_units_single_location, locations_code_unique, locations_release_units, public.categories, public.field_definitions, public.location_categories (+22 more)

### Community 62 - "Community 62"
Cohesion: 0.08
Nodes (25): EditorState, EMPTY_GRAPH, FeaturePatch, GRAPH_SHOWN, GRAPH_TOOLS, IDLE, isEmpty(), SaveSource (+17 more)

### Community 63 - "Community 63"
Cohesion: 0.10
Nodes (29): downloadPdf(), downloadPng(), INSTRUCTIONS, qrFilename(), save(), A6_PT, contentStream(), fixed() (+21 more)

### Community 64 - "Community 64"
Cohesion: 0.10
Nodes (36): RouteGraphStatus, ExploreContext, ExploreData, ExploreProvider(), loadSearch(), routeCache(), getCachedSearchIndex(), openDB() (+28 more)

### Community 65 - "Community 65"
Cohesion: 0.12
Nodes (36): SnapshotPolygon, IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings(), byFloor() (+28 more)

### Community 66 - "Community 66"
Cohesion: 0.05
Nodes (41): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+33 more)

### Community 67 - "Community 67"
Cohesion: 0.14
Nodes (35): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, adminScreenRect(), coverZoom(), cursor(), cursorPath() (+27 more)

### Community 68 - "Community 68"
Cohesion: 0.09
Nodes (33): Draft, LicenseForm(), QUOTA_FIELDS, QuotaKey, REQUIRED, toDraft(), toInput(), enabledFeatures() (+25 more)

### Community 69 - "Community 69"
Cohesion: 0.14
Nodes (31): ClosureDialog(), ClosureForm(), NO_CLOSURES, useClosureDialog, fromVenueInput(), impactText(), offsetMs(), targetLabel() (+23 more)

### Community 70 - "Community 70"
Cohesion: 0.11
Nodes (31): Certificate(), Disks(), LastBackup(), Row(), Services(), alertText(), date, dateTime (+23 more)

### Community 71 - "Community 71"
Cohesion: 0.05
Nodes (38): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+30 more)

### Community 72 - "Community 72"
Cohesion: 0.09
Nodes (14): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), capture(), shot(), checkTable(), IMPORT_HEADER (+6 more)

### Community 73 - "Community 73"
Cohesion: 0.09
Nodes (34): TRIAL_FEATURES, TRIAL_MAX_DAYS, TRIAL_MIN_DAYS, checkOnPremTrialRequest(), ONPREM_TRIAL_DEFAULT_DAYS, ONPREM_TRIAL_STATUSES, OnPremTrialCheck, onPremTrialRefusal() (+26 more)

### Community 74 - "Community 74"
Cohesion: 0.07
Nodes (25): app.trial_venue(), hosting.trials, app.can_write_floor(), app.can_write_location(), app.reject_locked_venue(), app.venue_locked(), app.writable_venue_ids(), edit_locks_trial_lock (+17 more)

### Community 75 - "Community 75"
Cohesion: 0.09
Nodes (34): EDITOR_CAM, EditorState, PUBLISH_BUTTON, TOOLS, VALIDATE_BUTTON, ADMIN_H, ADMIN_W, Connector (+26 more)

### Community 76 - "Community 76"
Cohesion: 0.12
Nodes (33): DisplayFormErrors, DisplayFormValues, HEIGHT_MESSAGES, number, toFormValues(), toPatch(), validate(), cameraSummary() (+25 more)

### Community 77 - "Community 77"
Cohesion: 0.10
Nodes (24): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, ensureStyle(), findTourTarget(), reducedMotion(), runTour(), TourEnd (+16 more)

### Community 78 - "Community 78"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 79 - "Community 79"
Cohesion: 0.10
Nodes (14): appServers, args, CI, projectArgs, perfEnv, tls, Violation, median() (+6 more)

### Community 80 - "Community 80"
Cohesion: 0.08
Nodes (20): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+12 more)

### Community 81 - "Community 81"
Cohesion: 0.08
Nodes (19): createCadConverterRepository(), post(), createEditLocksRepository(), acquire(), EditLocksRepository, Endpoint, LockRow, mapLockRow() (+11 more)

### Community 82 - "Community 82"
Cohesion: 0.11
Nodes (29): SnapshotConnector, SnapshotNavEdge, SnapshotNavNode, Network, at(), FLOORS, graphOf(), at() (+21 more)

### Community 83 - "Community 83"
Cohesion: 0.11
Nodes (29): WithTooltip(), PlanBackground, Editor(), footprintCenter(), useActivePlan(), useStepFloor(), EditorToolbar(), HistoryButton() (+21 more)

### Community 84 - "Community 84"
Cohesion: 0.06
Nodes (33): @types/node, bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+25 more)

### Community 85 - "Community 85"
Cohesion: 0.15
Nodes (31): addEntrance(), attachAt(), clamp01(), firstPosition(), inside(), LinkTargets, linkTargets(), nearestOnGraph() (+23 more)

### Community 86 - "Community 86"
Cohesion: 0.06
Nodes (31): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+23 more)

### Community 87 - "Community 87"
Cohesion: 0.11
Nodes (23): areaM2(), polygonAreaM2(), ringAreaM2(), roundAreaM2(), LinearRingSchema, LineString, LineStringSchema, MultiPolygon (+15 more)

### Community 88 - "Community 88"
Cohesion: 0.10
Nodes (27): ahead(), ORIGIN_LAYER_IDS, ORIGIN_SOURCE_ID, originCollection(), originLayers(), OriginMarker, setOriginMarkers(), appliedColors (+19 more)

### Community 89 - "Community 89"
Cohesion: 0.07
Nodes (31): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+23 more)

### Community 90 - "Community 90"
Cohesion: 0.08
Nodes (30): @tailwindcss/vite@catalog:, @tailwindcss/vite, @tailwindcss/vite@catalog:, @tailwindcss/vite@catalog:, react@catalog:, devDependencies, @biomejs/biome@catalog:, @tailwindcss/vite@catalog: (+22 more)

### Community 91 - "Community 91"
Cohesion: 0.15
Nodes (27): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+19 more)

### Community 92 - "Community 92"
Cohesion: 0.14
Nodes (25): BrandingFormErrors, BrandingFormValues, ColorNote, livePreview(), MESSAGES, ratio, empty, toBrandingFormValues() (+17 more)

### Community 93 - "Community 93"
Cohesion: 0.10
Nodes (21): BASEMAP_MESSAGES, orNull(), SystemFormErrors, SystemFormValues, SystemTextField, base, toPatch(), URL_MESSAGES (+13 more)

### Community 94 - "Community 94"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 95 - "Community 95"
Cohesion: 0.24
Nodes (30): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+22 more)

### Community 96 - "Community 96"
Cohesion: 0.12
Nodes (22): useVisitorTour(), useMediaQuery(), Brand(), DESKTOP_QUERY, Logo(), MOBILE_HEADER_PX, MapUnavailable(), useDebouncedValue() (+14 more)

### Community 97 - "Community 97"
Cohesion: 0.08
Nodes (19): app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, app.hook_password_verification_attempt(), app.request_account_notice(), app.server_settings (+11 more)

### Community 98 - "Community 98"
Cohesion: 0.12
Nodes (14): Entry, GraphChangesInput, GraphSaveQueue, GraphSaveQueueOptions, deferred(), setup(), venue, toChanges() (+6 more)

### Community 99 - "Community 99"
Cohesion: 0.12
Nodes (24): slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, hoursRows(), point(), VENUE_ROW_TABLES (+16 more)

### Community 100 - "Community 100"
Cohesion: 0.11
Nodes (22): createSelectionInteractions(), onDown(), onMove(), onUp(), preview(), HIGHLIGHT, HOVER, PICKABLE_LAYERS (+14 more)

### Community 101 - "Community 101"
Cohesion: 0.16
Nodes (24): inVenueTime(), ChangeSummary(), ActiveVersion(), kilobytes(), PublishButton(), VenuePublish(), activePublicationKey(), historyKey() (+16 more)

### Community 102 - "Community 102"
Cohesion: 0.08
Nodes (18): i18next@catalog:, NON_RETRYABLE, queryClient, LanguagePicker(), applyVenueLanguage(), initial, readStoredLanguage(), setLanguage() (+10 more)

### Community 103 - "Community 103"
Cohesion: 0.08
Nodes (14): app.can_access_floor(), app.can_access_location(), app.can_access_venue(), app.shares_accessible_profile(), public.venue_members, venue_members_user_idx, app.accessible_venue_ids(), app.all_venues_user() (+6 more)

### Community 104 - "Community 104"
Cohesion: 0.14
Nodes (21): FacilityIconPreview(), FILTERS, Open, choiceSource(), FILE_MESSAGES, IconChoice, IconField(), pickFile() (+13 more)

### Community 105 - "Community 105"
Cohesion: 0.07
Nodes (28): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+20 more)

### Community 106 - "Community 106"
Cohesion: 0.20
Nodes (19): airportStation, campus, custom, factoryWarehouse, hospital, hours, office, shoppingCenter (+11 more)

### Community 107 - "Community 107"
Cohesion: 0.15
Nodes (19): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText(), EULA_VERSION, isEulaVersion() (+11 more)

### Community 108 - "Community 108"
Cohesion: 0.18
Nodes (25): canvasArea(), unitCorner(), drawPlan(), camera(), deskAndMonitor(), LOBBY, lobby(), MONITOR (+17 more)

### Community 109 - "Community 109"
Cohesion: 0.08
Nodes (26): runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, name, runs-on (+18 more)

### Community 110 - "Community 110"
Cohesion: 0.13
Nodes (21): cert_json(), clean(), disk_json(), disks_json(), services_json(), health-report.sh script, ask(), assert_env_version() (+13 more)

### Community 111 - "Community 111"
Cohesion: 0.25
Nodes (21): closestBetween(), along(), anchored(), cross(), crossing(), distance(), EMPTY_PATCH, GraphChange (+13 more)

### Community 112 - "Community 112"
Cohesion: 0.10
Nodes (18): dependencies, @indoor/domain@workspace:*, maplibre-gl@catalog:, terra-draw@catalog:, terra-draw-maplibre-gl-adapter@catalog:, EDIT_COLORS, createPolygonDrawer(), PolygonDrawer (+10 more)

### Community 113 - "Community 113"
Cohesion: 0.08
Nodes (24): dependencies, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+16 more)

### Community 114 - "Community 114"
Cohesion: 0.10
Nodes (14): audit_events_occurred_idx, public.audit_events, public.edit_locks, public.system_settings, public.public_visitor_url(), app.floor_writable(), public.release_edit_lock(), public.take_over_edit_lock() (+6 more)

### Community 115 - "Community 115"
Cohesion: 0.13
Nodes (22): expected(), LocationPageFilters, expected(), newDb(), NO_FILTERS, signIn(), CategoryKey, createLargeVenue() (+14 more)

### Community 116 - "Community 116"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, GH_TOKEN, jobs, release, name, on (+15 more)

### Community 117 - "Community 117"
Cohesion: 0.09
Nodes (23): typescript, dependencies, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, ./fixtures/* (+15 more)

### Community 118 - "Community 118"
Cohesion: 0.13
Nodes (17): Json, ActorRow, asRecord(), AuditFilters, AuditRepository, AuditRow, mapAuditRows(), toPerson() (+9 more)

### Community 119 - "Community 119"
Cohesion: 0.12
Nodes (14): public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), public.publish_begin(), public.acquire_edit_lock(), public.publish_abort() (+6 more)

### Community 120 - "Community 120"
Cohesion: 0.15
Nodes (15): capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText(), floorGap() (+7 more)

### Community 121 - "Community 121"
Cohesion: 0.17
Nodes (17): colorNotes(), channel(), contrastRatio(), parseHex(), readableTextOn(), relativeLuminance(), WCAG_AA_TEXT, WCAG_AA_UI (+9 more)

### Community 122 - "Community 122"
Cohesion: 0.15
Nodes (6): _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 123 - "Community 123"
Cohesion: 0.18
Nodes (18): downloadCsvTemplate(), downloadXlsxTemplate(), save(), slug(), columnIndex(), columnName(), escapeXml(), firstSheetPath() (+10 more)

### Community 124 - "Community 124"
Cohesion: 0.14
Nodes (18): FIELD_PROBLEM_MESSAGES, useTypeChoice(), change(), lostOnChange(), CustomField, customFieldInput(), CustomFieldProblem, customFieldsSchema() (+10 more)

### Community 125 - "Community 125"
Cohesion: 0.15
Nodes (18): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+10 more)

### Community 126 - "Community 126"
Cohesion: 0.25
Nodes (18): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+10 more)

### Community 127 - "Community 127"
Cohesion: 0.14
Nodes (15): ComponentSummary, ConnectorLinks, graphComponents(), isolatedNodeIds(), NO_OTHERS, smallestId(), summarizeComponents(), unionFind() (+7 more)

### Community 128 - "Community 128"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 129 - "Community 129"
Cohesion: 0.14
Nodes (18): privacyPage(), OUTCOMES, pending, postVerify(), RequestResult, requestTrial(), VerifyResult, visitorUrl (+10 more)

### Community 130 - "Community 130"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 131 - "Community 131"
Cohesion: 0.11
Nodes (12): currentGraph(), GraphActions, OriginPointDraft, setEdgeAccessible(), EntranceSuggestion, Position, OriginPointInput, OriginSnap (+4 more)

### Community 132 - "Community 132"
Cohesion: 0.14
Nodes (13): PhoneState, ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paths (+5 more)

### Community 133 - "Community 133"
Cohesion: 0.17
Nodes (14): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+6 more)

### Community 134 - "Community 134"
Cohesion: 0.11
Nodes (19): @types/geojson@catalog:, @types/geojson, devDependencies, @biomejs/biome@catalog:, @types/geojson@catalog:, typescript@catalog:, vitest@catalog:, exports (+11 more)

### Community 135 - "Community 135"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+11 more)

### Community 136 - "Community 136"
Cohesion: 0.30
Nodes (11): useGraphActions(), applyEntrances(), removeEntrancesOf(), Draft, sameEdge(), sameNode(), mergeInto(), mergeNodes() (+3 more)

### Community 137 - "Community 137"
Cohesion: 0.16
Nodes (16): drawRoute(), strokeRoute(), camera(), dataLoop(), devices(), K, LOOP, OUTLINE (+8 more)

### Community 138 - "Community 138"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 139 - "Community 139"
Cohesion: 0.18
Nodes (15): db_psql(), dc(), die(), fetch_images(), health_check(), health_once(), install_schedules(), load_env() (+7 more)

### Community 140 - "Community 140"
Cohesion: 0.11
Nodes (15): attr(), brandDir, { chromium }, emailWidth, logo, outputs, paths, pngs (+7 more)

### Community 141 - "Community 141"
Cohesion: 0.17
Nodes (16): count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), CHANGE_GROUPS, changeCount() (+8 more)

### Community 142 - "Community 142"
Cohesion: 0.16
Nodes (13): checkCheckinRequest(), CheckinCheck, CheckinRequest, checkNewRelease(), InstallationReleaseState, installationReleaseState(), NewVendorRelease, readSha256() (+5 more)

### Community 143 - "Community 143"
Cohesion: 0.16
Nodes (15): DirectoryFilterOptions, DirectoryGroup, directoryGroups(), directoryLetter(), directoryLocations(), matchesPlace(), NO_DIRECTORY_FILTER, OUTDOOR_FILTER (+7 more)

### Community 144 - "Community 144"
Cohesion: 0.12
Nodes (17): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, exports, vite (+9 more)

### Community 145 - "Community 145"
Cohesion: 0.14
Nodes (15): saveValid(), { chromium }, envFile, locationId(), OUT, require, rest(), root (+7 more)

### Community 146 - "Community 146"
Cohesion: 0.29
Nodes (14): home(), LanguageSwitch(), MobileMenu(), SiteFooter(), SiteHeader(), useDocumentMeta(), PrivacyPage(), retryVerify() (+6 more)

### Community 147 - "Community 147"
Cohesion: 0.32
Nodes (13): App(), Gate, gateKey, readGate(), AuthShell(), errorText(), FormNotice(), LoginForm() (+5 more)

### Community 148 - "Community 148"
Cohesion: 0.12
Nodes (17): condition, auth, storage, ADMIN_URL, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD (+9 more)

### Community 149 - "Community 149"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 150 - "Community 150"
Cohesion: 0.13
Nodes (16): @biomejs/biome, dependencies, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, vitest (+8 more)

### Community 151 - "Community 151"
Cohesion: 0.19
Nodes (15): applyGraphPatch(), edgeLengthM(), apply(), BASE, degree(), draw(), edgeList(), EMPTY (+7 more)

### Community 152 - "Community 152"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 153 - "Community 153"
Cohesion: 0.29
Nodes (13): BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap(), FULL_TOP_GAP_PX (+5 more)

### Community 154 - "Community 154"
Cohesion: 0.21
Nodes (8): contrastOn(), enableAutoTours(), luminance(), resetTourProgress(), TourPopover, tourProgress(), openVenue(), PHONE_EN

### Community 155 - "Community 155"
Cohesion: 0.17
Nodes (11): app.enforce_publish_per_day(), app.enforce_quota(), app.enforce_storage_quota(), app.license_is_trial(), features_quota, locations_quota, objects_license_quota, origin_points_quota (+3 more)

### Community 156 - "Community 156"
Cohesion: 0.26
Nodes (5): SaveOp, SaveQueue, SaveQueueOptions, deferred(), setup()

### Community 158 - "Community 158"
Cohesion: 0.24
Nodes (8): createNotificationsRepository(), NotificationsRepository, isNotificationKind(), NOTIFICATION_KINDS, NotificationKind, NotificationPreferences, RECIPIENT_ROLES, withDefaultPreferences()

### Community 159 - "Community 159"
Cohesion: 0.21
Nodes (10): Db, DEMO_USERS, demoClosures(), demoEmail(), hoursFromNow(), RELEASE_NOTES, seedDemoUsers(), seedPublishHistory() (+2 more)

### Community 160 - "Community 160"
Cohesion: 0.33
Nodes (9): iconSpecs(), categoryIconSpecs(), facilityIconSpecs(), parseFacilityIcon(), categoryIconTypeId(), FacilityIconSpec, categoryUnitColors(), tintColor() (+1 more)

### Community 161 - "Community 161"
Cohesion: 0.15
Nodes (13): depends_on, image, restart, condition, aliases, db, depends_on, image (+5 more)

### Community 162 - "Community 162"
Cohesion: 0.15
Nodes (13): ADMIN_DOMAIN, API_DOMAIN, PANDUARAH_ANON_KEY, PANDUARAH_API_URL, TLS_DIRECTIVE, VISITOR_DOMAIN, web, depends_on (+5 more)

### Community 163 - "Community 163"
Cohesion: 0.15
Nodes (13): ANON_KEY, AUTH_JWT_SECRET, DATABASE_URL, ENABLE_IMAGE_TRANSFORMATION, FILE_SIZE_LIMIT, FILE_STORAGE_BACKEND_PATH, GLOBAL_S3_BUCKET, POSTGREST_URL (+5 more)

### Community 164 - "Community 164"
Cohesion: 0.15
Nodes (12): patterns, prefix, actions, interval, updates, commit-message, directory, groups (+4 more)

### Community 165 - "Community 165"
Cohesion: 0.17
Nodes (12): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, depends_on (+4 more)

### Community 166 - "Community 166"
Cohesion: 0.24
Nodes (3): ConversionError, render_svg(), RenderTest

### Community 167 - "Community 167"
Cohesion: 0.23
Nodes (12): steps, steps, BASE, CHANGES, E2E, steps, env, id (+4 more)

### Community 168 - "Community 168"
Cohesion: 0.17
Nodes (12): if, name, needs, runs-on, strategy, timeout-minutes, args, name (+4 more)

### Community 169 - "Community 169"
Cohesion: 0.23
Nodes (9): hhmm(), isOpenAt(), localParts(), minutes(), OpeningHoursProblem, OpeningSpan, shiftDate(), spansOn() (+1 more)

### Community 170 - "Community 170"
Cohesion: 0.17
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 171 - "Community 171"
Cohesion: 0.20
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 172 - "Community 172"
Cohesion: 0.20
Nodes (9): en, id, TRIAL_COPY, TrialCopy, shape(), BUILDING_SIZES, BUILDING_TYPES, BuildingSize (+1 more)

### Community 173 - "Community 173"
Cohesion: 0.18
Nodes (10): image, restart, name, services, cad, volumes, caddy-config, caddy-data (+2 more)

### Community 174 - "Community 174"
Cohesion: 0.20
Nodes (11): environment, ALLOWED_ORIGINS, APP_VERSION, JWT_SECRET, LICENSE_VENDOR_URL, SEND_EMAIL_HOOK_SECRET, SUPABASE_ANON_KEY, SUPABASE_DB_URL (+3 more)

### Community 175 - "Community 175"
Cohesion: 0.35
Nodes (9): BRANDING_KEYS, checkBranding(), EMPTY_BRANDING, isRecord(), MAX_DISPLAY_NAME_LENGTH, nameLength(), parseBranding(), tidyName() (+1 more)

### Community 176 - "Community 176"
Cohesion: 0.24
Nodes (9): BASE, corridor, EMPTY, FEATURES, m(), near(), point(), unit() (+1 more)

### Community 177 - "Community 177"
Cohesion: 0.20
Nodes (7): anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 178 - "Community 178"
Cohesion: 0.29
Nodes (9): commit(), Calibration(), GeoreferencePanel(), meters, NumberField(), commit(), parseDecimal(), submit() (+1 more)

### Community 179 - "Community 179"
Cohesion: 0.24
Nodes (8): accept(), checkImageFile(), EXTENSION_BY_MIME, ImageFileCheck, ImageFileProblem, ImageMime, MAX_IMAGE_BYTES, MIME_BY_EXTENSION

### Community 180 - "Community 180"
Cohesion: 0.38
Nodes (6): useVenueBranding(), snapshot, VenueBrand, venueBrand(), brandDisplayName(), applyBranding()

### Community 181 - "Community 181"
Cohesion: 0.20
Nodes (10): outputs, runs-on, jobs, changes, result, code, if, name (+2 more)

### Community 182 - "Community 182"
Cohesion: 0.29
Nodes (8): ConnectorInput, ConnectorRow, createConnectorsRepository(), isDirection(), isKind(), mapConnectorRow(), row, ConnectorDraft

### Community 183 - "Community 183"
Cohesion: 0.31
Nodes (6): PictogramKey, TemplateCategory, TemplateFacilityType, partAttributes(), PICTOGRAM_SHAPES, PictogramPart

### Community 184 - "Community 184"
Cohesion: 0.29
Nodes (8): areaFilter(), CLOSURE_COLOR, CLOSURE_LAYER_IDS, CLOSURE_SOURCE_ID, closureCollection(), closureLayers(), ClosureMarks, setClosureMarks()

### Community 185 - "Community 185"
Cohesion: 0.36
Nodes (7): gridGraph(), distance(), graphCost(), random(), randomGraph(), RandomGraphOptions, referenceCost()

### Community 186 - "Community 186"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 188 - "Community 188"
Cohesion: 0.33
Nodes (7): app.backup_runs, app.health_alerts, app.health_backup_result(), app.health_conditions(), app.server_health, backup_runs_finished_idx, public.system_health()

### Community 189 - "Community 189"
Cohesion: 0.36
Nodes (7): submit(), isValidTimezone(), checkVenueInput(), confirmsVenueDeletion(), formatLatLng(), parseLatLng(), VenueInputProblem

### Community 190 - "Community 190"
Cohesion: 0.22
Nodes (9): command, environment, image, restart, volumes, PGPORT, POSTGRES_DB, POSTGRES_PASSWORD (+1 more)

### Community 191 - "Community 191"
Cohesion: 0.22
Nodes (9): with, cache, fetch-depth, if-no-files-found, key, name, node-version-file, path (+1 more)

### Community 192 - "Community 192"
Cohesion: 0.22
Nodes (3): baseline, pg_temp.current(), pg_temp.requests()

### Community 193 - "Community 193"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../tsconfig.base.json

### Community 194 - "Community 194"
Cohesion: 0.36
Nodes (3): license_of(), license_text(), main()

### Community 195 - "Community 195"
Cohesion: 0.29
Nodes (6): ALL, capture(), MENUS, shot(), SUPER_ADMIN_ONLY, WITHOUT_ADMIN_ONLY

### Community 196 - "Community 196"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 197 - "Community 197"
Cohesion: 0.38
Nodes (4): Demo(), DemoBoundary, DemoMap, DEMO_URL

### Community 198 - "Community 198"
Cohesion: 0.43
Nodes (5): apply(), saved(), systemDark(), Theme, ThemeToggle()

### Community 199 - "Community 199"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 200 - "Community 200"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 201 - "Community 201"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 203 - "Community 203"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 204 - "Community 204"
Cohesion: 0.29
Nodes (7): rest, condition, storage, depends_on, image, restart, volumes

### Community 206 - "Community 206"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 207 - "Community 207"
Cohesion: 0.29
Nodes (6): concurrency, cancel-in-progress, group, name, permissions, contents

### Community 208 - "Community 208"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 209 - "Community 209"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 210 - "Community 210"
Cohesion: 0.53
Nodes (5): BrandingPreview(), CHIPS, Mark(), RouteSketch(), brandingTokens()

### Community 211 - "Community 211"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

### Community 212 - "Community 212"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 213 - "Community 213"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 214 - "Community 214"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 215 - "Community 215"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 217 - "Community 217"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 218 - "Community 218"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 219 - "Community 219"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 220 - "Community 220"
Cohesion: 0.33
Nodes (5): vulnerabilities, expired_at, id, purls, statement

### Community 221 - "Community 221"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 222 - "Community 222"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 223 - "Community 223"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 224 - "Community 224"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 225 - "Community 225"
Cohesion: 0.40
Nodes (5): on, pull_request, push, workflow_dispatch, branches

## Knowledge Gaps
- **5 isolated node(s):** `RFC-4180`, `TARGETS`, `RFC-6238`, `RFC-2045`, `RFC-2387`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2513 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **80 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-i18next` connect `Community 26` to `Community 96`, `Community 0`, `Community 32`, `Community 2`, `Community 102`, `Community 42`, `Community 77`, `Community 19`, `Community 22`, `Community 153`, `Community 90`, `Community 29`, `Community 30`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `RFC-4180`, `TARGETS`, `RFC-6238` to the rest of the system?**
  _5 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.03066482342591429 - nodes in this community are weakly interconnected._
- **Why does `maplibre-gl` connect `Community 37` to `Community 100`, `Community 134`, `Community 102`, `Community 40`, `Community 88`, `Community 45`, `Community 112`, `Community 17`, `Community 50`, `Community 184`, `Community 25`, `Community 59`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.027577184720041864 - nodes in this community are weakly interconnected._
- **Why does `@biomejs/biome` connect `Community 150` to `Community 134`, `Community 144`, `Community 49`, `Community 113`, `Community 84`, `Community 117`, `Community 22`, `Community 55`, `Community 89`, `Community 90`, `Community 57`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._