# Graph Report - indoor-map  (2026-11-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 8168 nodes · 25860 edges · 283 communities (211 shown, 72 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 387 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c77e6096`
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
- Community 157
- Community 158
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
- Community 216
- Community 217
- Community 219
- Community 220
- Community 221
- Community 222
- Community 223
- Community 227
- Community 230
- Community 231
- Community 232
- Community 233
- Community 234
- Community 235
- Community 239

## God Nodes (most connected - your core abstractions)
1. `Button()` - 264 edges
2. `VenueId` - 192 edges
3. `cn()` - 144 edges
4. `Input()` - 111 edges
5. `test` - 108 edges
6. `createRepositories()` - 99 edges
7. `toDataError()` - 93 edges
8. `FormNotice()` - 90 edges
9. `DataError` - 85 edges
10. `Skeleton()` - 77 edges

## Surprising Connections (you probably didn't know these)
- `ClosureMarkData` --references--> `SnapshotPosition`  [EXTRACTED]
  apps/visitor/src/features/closures/closure-model.ts → packages/domain/src/snapshot.ts
- `DemoRouteOptions` --references--> `Snapshot`  [EXTRACTED]
  apps/landing/src/demo/use-demo-route.ts → packages/domain/src/snapshot.ts
- `Attempt` --references--> `DataClient`  [EXTRACTED]
  e2e/support/role-attempts.ts → packages/data/src/client.ts
- `FloorTarget` --references--> `BuildingId`  [EXTRACTED]
  apps/admin/src/features/venues/floors/queries.ts → packages/domain/src/ids.ts
- `submit()` --indirect_call--> `position()`  [INFERRED]
  apps/admin/src/features/editor/connectors/connector-dialog.tsx → packages/routing/src/legs.ts

## Import Cycles
- None detected.

## Communities (283 total, 72 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (162): ColorField(), isColorValue(), Field(), VenuePicker(), AliasField(), FormNotice(), ClosureDialog(), ClosureForm() (+154 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (135): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, createAuthRepository(), signOut() (+127 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (102): RFC-6238, createRepositories(), DataClientConfig, CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema (+94 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (40): FOOTPRINT, linkUnitsToPath(), PublishedVenue, test, TEST_CENTER, TestVenue, unitSquare(), AdminShell (+32 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (118): Can(), GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), currentProfileKey, useCurrentProfile(), HomeRedirect() (+110 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (84): BrandGallery(), DataTableGallery(), Section(), ContrastTable(), readToken(), SURFACES, TEXT_PAIRS, TOKENS (+76 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (108): UnitLocation(), ACTION_LABELS, ImportDialog(), choose(), PLAN_COLUMNS, PlanTable(), RESULT_FILTER, Summary() (+100 more)

### Community 7 - "Community 7"
Cohesion: 0.03
Nodes (86): move(), CategoriesRepository, mapCategoryRow(), createLocationTypesRepository(), FieldRow, LocationTypesRepository, mapFieldRow(), mapLocationTypeRow() (+78 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (91): submit(), haversineM(), SnapshotConnectorKind, SnapshotGraph, SnapshotPosition, ARC_ACCESSIBLE, ARC_CONNECTOR, ArcDraft (+83 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (65): seedPublishHistory(), envFile, VENUES, CONTEXT, VENUES, AIRLINES, airportVenue(), FOOD (+57 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (94): COLUMNS, date, DEMO_STATES, DemoState, FILTERS, FLOORS, NAMES, Room (+86 more)

### Community 11 - "Community 11"
Cohesion: 0.03
Nodes (71): saveValid(), page, json(), read(), results, root, repoRoot, settled() (+63 more)

### Community 12 - "Community 12"
Cohesion: 0.04
Nodes (79): useAuthSync(), RequireAuth(), data, initialAuthRedirectHash, useVenueSelection, venuesKey, aliasesKey(), PROBLEM_MESSAGES (+71 more)

### Community 13 - "Community 13"
Cohesion: 0.04
Nodes (62): TestRouteState, SheetSnap, RouteGraphStatus, featureName(), featurePosition(), featureView(), OriginView, originView() (+54 more)

### Community 14 - "Community 14"
Cohesion: 0.03
Nodes (38): VenueSelection, DataClient, AliasesRepository, ClosuresRepository, ConnectorsRepository, FeaturesRepository, NavGraphRepository, OriginPointsRepository (+30 more)

### Community 15 - "Community 15"
Cohesion: 0.05
Nodes (83): loadCrowd(), areaSpots(), arrive(), between(), blankPerson(), buildNets(), createCrowd(), Crowd (+75 more)

### Community 16 - "Community 16"
Cohesion: 0.06
Nodes (78): crowdAreas(), floorCollection(), iconSpecs(), cache, DemoMap(), DemoVenue, snapshotOf(), SNAPSHOTS (+70 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (71): EntityIcon(), ListRow(), FacilityDetail(), Missing(), UnitDetail(), FieldValue(), LocationProfile(), Places() (+63 more)

### Community 18 - "Community 18"
Cohesion: 0.05
Nodes (39): env, envFile, appServers, args, CI, projectArgs, createHostedTrial(), endHostedTrial() (+31 more)

### Community 19 - "Community 19"
Cohesion: 0.04
Nodes (77): DirectoryFilterOptions, DirectoryGroup, directoryGroups(), directoryLetter(), directoryLocations(), matchesPlace(), NO_DIRECTORY_FILTER, OUTDOOR_FILTER (+69 more)

### Community 20 - "Community 20"
Cohesion: 0.04
Nodes (56): facility, index, snapshot, at(), gzipBytes(), largeVenue(), ring(), INFO_POINT_ZOOM (+48 more)

### Community 21 - "Community 21"
Cohesion: 0.04
Nodes (50): Geometry, COORDINATE_DECIMALS, createFeatureEditor(), onClick(), drawStyles(), EditableFeature, editableFlags(), FeatureEditor (+42 more)

### Community 22 - "Community 22"
Cohesion: 0.06
Nodes (63): NOTIFICATION_LABELS, UnsubscribePage(), App(), Gate, gateKey, readGate(), AuthShell(), errorText() (+55 more)

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (60): FOCUS_MIN_ZOOM, focusFeature(), focusZoom(), geometryBounds(), prefersReducedMotion(), EDIT_COLORS, Corners, areaFilter() (+52 more)

### Community 24 - "Community 24"
Cohesion: 0.06
Nodes (68): signedLicense(), paidLicense(), canonicalize(), fromBase64(), isCount(), isDate(), isText(), Json (+60 more)

### Community 25 - "Community 25"
Cohesion: 0.06
Nodes (63): FeatureKind, MapFeatureProperties, DEFAULT_FILL, DEFAULT_HEIGHTS, DEFAULT_OUTLINE, MAP_BACKGROUND, OUTDOOR_SUBTYPE_FILL, POINT_COLOR (+55 more)

### Community 26 - "Community 26"
Cohesion: 0.04
Nodes (57): createEditLocksRepository(), acquire(), EditLocksRepository, Endpoint, LockRow, mapLockRow(), FloorRow, zod@catalog: (+49 more)

### Community 27 - "Community 27"
Cohesion: 0.06
Nodes (57): app.check_edge_same_floor(), app.check_unit_single_location(), app.on_venue_created(), app.release_units_on_permanent_close(), app.touch_updated_at(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx (+49 more)

### Community 28 - "Community 28"
Cohesion: 0.04
Nodes (45): app.user_role(), audit_events_occurred_idx, public.audit_events, public.profiles, app.hook_password_verification_attempt(), app.guard_last_super_admin(), app.log_profile_changes(), profiles_guard_last_super_admin (+37 more)

### Community 29 - "Community 29"
Cohesion: 0.05
Nodes (49): GraphLayer(), graphViews(), neighbourPositions(), NO_STATUS, Georeferencer, LngLat, createGraphInteractions(), onMove() (+41 more)

### Community 30 - "Community 30"
Cohesion: 0.08
Nodes (52): PanelMessage(), NON_RETRYABLE, queryClient, useMediaQuery(), Brand(), DESKTOP_QUERY, Logo(), MapArea() (+44 more)

### Community 31 - "Community 31"
Cohesion: 0.06
Nodes (50): FIELD_PROBLEM_MESSAGES, useTypeChoice(), change(), lostOnChange(), createVariedVenues(), specs(), VenueSpec, checkCustomField() (+42 more)

### Community 32 - "Community 32"
Cohesion: 0.06
Nodes (51): EntranceField(), EntranceLayer(), EntranceState, IDLE, useEntranceStore, EntrancesPanel(), suggest(), FeatureButton() (+43 more)

### Community 33 - "Community 33"
Cohesion: 0.06
Nodes (35): submit(), ACCOUNTS, LoginPage, InvitedUser, inviteUser(), Mail, MailpitDetail, MailpitSummary (+27 more)

### Community 34 - "Community 34"
Cohesion: 0.05
Nodes (41): Tables, TablesUpdate, zeroRowsError(), CategoryRow, createCategoriesRepository(), removeFile(), saveError(), uploadIcon() (+33 more)

### Community 35 - "Community 35"
Cohesion: 0.07
Nodes (55): areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, checkPolygon(), duplicateCodeIssues(), GEOMETRY_ISSUE_CODES, GeometryIssueCode (+47 more)

### Community 36 - "Community 36"
Cohesion: 0.06
Nodes (51): copy(), BPM, Copy, COPY, EN, ID, SCENES, assets (+43 more)

### Community 37 - "Community 37"
Cohesion: 0.05
Nodes (59): dependencies, fflate@^0.8.3, @indoor/data@workspace:*, @indoor/domain@workspace:*, @indoor/map-core@workspace:*, @indoor/routing@workspace:*, @indoor/ui@workspace:*, lucide-react@catalog: (+51 more)

### Community 38 - "Community 38"
Cohesion: 0.06
Nodes (43): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+35 more)

### Community 39 - "Community 39"
Cohesion: 0.07
Nodes (45): InstructionErrors, previewInstruction(), SAMPLE, SAMPLE_FLOOR, validateInstruction(), distanceM(), INSTRUCTION_ACTION_LABELS, InstructionAction (+37 more)

### Community 40 - "Community 40"
Cohesion: 0.06
Nodes (25): deferred(), setup(), venue, submit(), NavGraphChanges, createNotificationsRepository(), NotificationsRepository, checkBuildingInput() (+17 more)

### Community 41 - "Community 41"
Cohesion: 0.07
Nodes (36): changeKind(), CONNECTOR_PROBLEM_MESSAGES, ConnectorForm, defaultName(), formDraft(), formFloorIds(), FormPlace, initialForm() (+28 more)

### Community 42 - "Community 42"
Cohesion: 0.07
Nodes (49): TrialForm(), columns, dateTime, LicenseHistory(), SOURCE_LABELS, Banner(), CheckinNotice(), date (+41 more)

### Community 43 - "Community 43"
Cohesion: 0.07
Nodes (43): DisplayFormErrors, DisplayFormValues, HEIGHT_MESSAGES, number, settings, DisplaySettingsRepository, DisplaySettingsRow, mapDisplaySettingsRow() (+35 more)

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (49): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+41 more)

### Community 45 - "Community 45"
Cohesion: 0.09
Nodes (43): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+35 more)

### Community 46 - "Community 46"
Cohesion: 0.10
Nodes (47): resize(), FALLBACK_CENTER, footprintBox(), loadImageSize(), Measure, startingPlacement(), useGeoreference(), calibrate() (+39 more)

### Community 47 - "Community 47"
Cohesion: 0.07
Nodes (17): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), capture(), shot(), checkTable(), IMPORT_HEADER (+9 more)

### Community 48 - "Community 48"
Cohesion: 0.10
Nodes (38): drawKindLabel(), drawKindValue(), OUTDOOR_SUBTYPE_LABELS, UNIT_STATUS_LABELS, KindPicker(), choose(), createForUnit(), editorQueues() (+30 more)

### Community 49 - "Community 49"
Cohesion: 0.09
Nodes (41): BrandingFormErrors, BrandingFormValues, ColorNote, colorNotes(), livePreview(), MESSAGES, ratio, empty (+33 more)

### Community 50 - "Community 50"
Cohesion: 0.08
Nodes (39): EULA_VERSION, isEulaVersion(), needsEulaAcceptance(), importLicensePublicKey(), LicenseRejection, InviteInput, inviteScope(), Role (+31 more)

### Community 51 - "Community 51"
Cohesion: 0.09
Nodes (40): inVenueTime(), infoPointsKey(), useRemoveInfoPoint(), useSaveInfoPoint(), originPointsKey(), SnapError, toChanges(), useOriginPoints() (+32 more)

### Community 52 - "Community 52"
Cohesion: 0.06
Nodes (8): VisitorPage, shot(), visitorSearch(), DESKTOP, repoRoot, collator, Demo, Venue

### Community 53 - "Community 53"
Cohesion: 0.08
Nodes (40): InsertedVenue, SnapshotBasemap, SnapshotConnector, SnapshotFeatureKind, SnapshotField, SnapshotGeometry, SnapshotInfoPoint, SnapshotLanguage (+32 more)

### Community 54 - "Community 54"
Cohesion: 0.08
Nodes (33): RFC-2045, RFC-2387, accepted(), claim(), logError(), NoticeRow, release(), text() (+25 more)

### Community 55 - "Community 55"
Cohesion: 0.12
Nodes (34): HOSTED_TRIAL_DAYS, content(), dateText(), dateTimeText(), NoticeDetails, NoticeEmail, renderAccountNotice(), sentence() (+26 more)

### Community 56 - "Community 56"
Cohesion: 0.06
Nodes (29): licenses_one_current, public.installation, public.licenses, app.license_active(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+21 more)

### Community 57 - "Community 57"
Cohesion: 0.05
Nodes (44): @types/react-dom@catalog:, @types/react-dom, @types/react-dom@catalog:, @types/react-dom@catalog:, @types/react-dom@catalog:, dependencies, class-variance-authority@catalog:, clsx@catalog: (+36 more)

### Community 58 - "Community 58"
Cohesion: 0.06
Nodes (25): app.trial_venue(), hosting.trials, hosting.blocklist, hosting.trial_requests, hosting.vendor_staff, public.hosting_request_get(), public.hosting_request_requeue(), public.hosting_request_verify() (+17 more)

### Community 59 - "Community 59"
Cohesion: 0.08
Nodes (35): downloadCsvTemplate(), downloadXlsxTemplate(), save(), slug(), columnIndex(), columnName(), escapeXml(), firstSheetPath() (+27 more)

### Community 60 - "Community 60"
Cohesion: 0.10
Nodes (29): downloadPdf(), downloadPng(), INSTRUCTIONS, qrFilename(), save(), A6_PT, contentStream(), fixed() (+21 more)

### Community 61 - "Community 61"
Cohesion: 0.10
Nodes (34): Certificate(), Disks(), LastBackup(), Row(), Services(), alertText(), date, dateTime (+26 more)

### Community 62 - "Community 62"
Cohesion: 0.07
Nodes (21): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+13 more)

### Community 63 - "Community 63"
Cohesion: 0.08
Nodes (24): public.categories, public.facility_types, public.field_definitions, public.location_categories, public.location_types, public.locations, public.search_aliases, app.check_location_category_type() (+16 more)

### Community 64 - "Community 64"
Cohesion: 0.05
Nodes (41): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+33 more)

### Community 65 - "Community 65"
Cohesion: 0.10
Nodes (34): PlaceDisplay, floorText(), KIND_ORDER, placeKey(), PlaceKind, placeName(), PlaceOption, placeOptions() (+26 more)

### Community 66 - "Community 66"
Cohesion: 0.14
Nodes (35): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, adminScreenRect(), coverZoom(), cursor(), cursorPath() (+27 more)

### Community 67 - "Community 67"
Cohesion: 0.10
Nodes (30): EMPTY_SNAPSHOT_GRAPH, snapshotGraphPath(), splitSnapshot(), INACTIVE, Release, serviceHeaders, url, SmtpRow (+22 more)

### Community 68 - "Community 68"
Cohesion: 0.05
Nodes (38): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+30 more)

### Community 69 - "Community 69"
Cohesion: 0.06
Nodes (37): @biomejs/biome, typescript, dependencies, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports (+29 more)

### Community 70 - "Community 70"
Cohesion: 0.07
Nodes (14): AuthRepository, MfaRepository, ProfilesRepository, UsersRepository, Db, DEMO_USERS, demoClosures(), demoEmail() (+6 more)

### Community 71 - "Community 71"
Cohesion: 0.13
Nodes (28): useConnectorDialog, ConnectorDetails(), DIRECTION_LABELS, stopNames(), connectorsKey(), syncStop(), useConnectorMutations(), useConnectors() (+20 more)

### Community 72 - "Community 72"
Cohesion: 0.09
Nodes (34): EDITOR_CAM, EditorState, PUBLISH_BUTTON, TOOLS, VALIDATE_BUTTON, ADMIN_H, ADMIN_W, Connector (+26 more)

### Community 73 - "Community 73"
Cohesion: 0.09
Nodes (32): FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, ACTION_ROLES, ADMIN_ACTIONS (+24 more)

### Community 74 - "Community 74"
Cohesion: 0.08
Nodes (27): AUDIT_LABELS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES, roleLabel(), SETTING_FIELDS, target (+19 more)

### Community 75 - "Community 75"
Cohesion: 0.10
Nodes (24): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, ensureStyle(), findTourTarget(), reducedMotion(), runTour(), TourEnd (+16 more)

### Community 76 - "Community 76"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 77 - "Community 77"
Cohesion: 0.10
Nodes (23): closureTargetAt(), attributed, Basemap, BASEMAP_LAYER_ID, BASEMAP_SOURCE_ID, firstLayerAfterBackground(), setBasemap(), graphElementAt() (+15 more)

### Community 78 - "Community 78"
Cohesion: 0.12
Nodes (27): applyEntitlements(), enabledFeatures(), FEATURE_LABELS, PAID_FEATURES, hasBlockingFindings(), venueToday(), activeSnapshot(), activeVersion() (+19 more)

### Community 79 - "Community 79"
Cohesion: 0.07
Nodes (32): @types/react@catalog:, @types/react, @types/react@catalog:, @types/react@catalog:, i18next@catalog:, react@catalog:, devDependencies, @biomejs/biome@catalog: (+24 more)

### Community 80 - "Community 80"
Cohesion: 0.06
Nodes (31): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+23 more)

### Community 81 - "Community 81"
Cohesion: 0.07
Nodes (31): @indoor/third-party-notices@workspace:*, @vitejs/plugin-react@catalog:, @indoor/third-party-notices, @vitejs/plugin-react, react@catalog:, devDependencies, @biomejs/biome@catalog:, @indoor/third-party-notices@workspace:* (+23 more)

### Community 82 - "Community 82"
Cohesion: 0.07
Nodes (31): tailwindcss@catalog:, @tailwindcss/vite@catalog:, tailwindcss, @tailwindcss/vite, tailwindcss@catalog:, @tailwindcss/vite@catalog:, react@catalog:, devDependencies (+23 more)

### Community 83 - "Community 83"
Cohesion: 0.09
Nodes (21): Fixtures, globalSetup(), SERVER_ATTEMPTS, capture(), expected(), shot(), as(), ROLES (+13 more)

### Community 84 - "Community 84"
Cohesion: 0.07
Nodes (31): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+23 more)

### Community 85 - "Community 85"
Cohesion: 0.11
Nodes (22): toFeatureColumns(), areaM2(), polygonAreaM2(), ringAreaM2(), roundAreaM2(), LinearRingSchema, LineString, LineStringSchema (+14 more)

### Community 86 - "Community 86"
Cohesion: 0.08
Nodes (16): LicenseRepository, PaidFeature, GRACE_DAYS, importTooLarge(), LicenseLimits, LicenseNotice, LIMIT_KINDS, LIMIT_LABELS (+8 more)

### Community 87 - "Community 87"
Cohesion: 0.12
Nodes (28): MapLabel, hasLocationIcon, kind, LABEL_LAYER_ID, LABEL_SOURCE_ID, labelCollection(), canvas2d(), drawBadge() (+20 more)

### Community 88 - "Community 88"
Cohesion: 0.10
Nodes (26): ClosureDialogState, interceptCanvasClick(), ClosureMenu, CONTROL_LABELS, EditorCanvas(), FALLBACK_CENTER, PlanBackground, toCollection() (+18 more)

### Community 89 - "Community 89"
Cohesion: 0.15
Nodes (27): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+19 more)

### Community 90 - "Community 90"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 91 - "Community 91"
Cohesion: 0.24
Nodes (30): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+22 more)

### Community 92 - "Community 92"
Cohesion: 0.12
Nodes (25): BuildingType, slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, hoursRows(), point() (+17 more)

### Community 93 - "Community 93"
Cohesion: 0.14
Nodes (22): FacilityIconPreview(), FacilityTypeSelect(), FILTERS, Open, choiceSource(), FILE_MESSAGES, IconField(), pickFile() (+14 more)

### Community 94 - "Community 94"
Cohesion: 0.17
Nodes (27): hasOpeningHours(), buildSnapshot(), byId(), isColor(), isFieldValue(), isHeight(), isRecord(), pickKinds() (+19 more)

### Community 95 - "Community 95"
Cohesion: 0.08
Nodes (25): connector(), connectors, edge(), edges, escalatorDown, escalatorUp, gtColumns, gtDoor (+17 more)

### Community 96 - "Community 96"
Cohesion: 0.08
Nodes (15): app.can_access_floor(), app.can_access_location(), app.can_access_location_type(), app.can_access_venue(), app.shares_accessible_profile(), public.venue_members, venue_members_user_idx, app.accessible_venue_ids() (+7 more)

### Community 97 - "Community 97"
Cohesion: 0.20
Nodes (27): addEntrance(), attachAt(), clamp01(), closestBetween(), firstPosition(), inside(), LinkTargets, linkTargets() (+19 more)

### Community 98 - "Community 98"
Cohesion: 0.16
Nodes (22): home(), LanguageSwitch(), privacyPage(), SiteFooter(), SiteHeader(), useDocumentMeta(), PAGES, root (+14 more)

### Community 99 - "Community 99"
Cohesion: 0.07
Nodes (28): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+20 more)

### Community 100 - "Community 100"
Cohesion: 0.20
Nodes (24): IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings(), byFloor(), finding() (+16 more)

### Community 101 - "Community 101"
Cohesion: 0.08
Nodes (19): public.system_settings, app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, public.public_visitor_url(), app.server_settings (+11 more)

### Community 102 - "Community 102"
Cohesion: 0.10
Nodes (16): ConnectorDialogState, OriginPointDraft, setEdgeAccessible(), Position, GraphPatch, NAV_NODE_ROLES, NavGraph, NavNodeRole (+8 more)

### Community 103 - "Community 103"
Cohesion: 0.13
Nodes (21): BASEMAP_MESSAGES, orNull(), SystemFormErrors, SystemFormValues, SystemTextField, base, toPatch(), URL_MESSAGES (+13 more)

### Community 104 - "Community 104"
Cohesion: 0.18
Nodes (25): canvasArea(), unitCorner(), drawPlan(), camera(), deskAndMonitor(), LOBBY, lobby(), MONITOR (+17 more)

### Community 105 - "Community 105"
Cohesion: 0.17
Nodes (20): ConnectorPanel(), ANCHOR_OWNERS, Facts(), GraphProperties(), meters(), NODE_ROLE_LABELS, FEATURE_KIND_LABELS, CommitInput() (+12 more)

### Community 106 - "Community 106"
Cohesion: 0.20
Nodes (16): currentGraph(), GraphActions, useGraphActions(), applyEntrances(), EntranceSuggestion, removeEntrancesOf(), Draft, sameEdge() (+8 more)

### Community 107 - "Community 107"
Cohesion: 0.13
Nodes (21): cert_json(), clean(), disk_json(), disks_json(), services_json(), health-report.sh script, ask(), assert_env_version() (+13 more)

### Community 108 - "Community 108"
Cohesion: 0.17
Nodes (22): at(), CATEGORY_ID, DENSE_FLOOR, FACILITY_TYPE_ID, floorFeatures(), FloorGraph, floorGraph(), floorName() (+14 more)

### Community 109 - "Community 109"
Cohesion: 0.14
Nodes (16): capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText(), floorGap() (+8 more)

### Community 110 - "Community 110"
Cohesion: 0.11
Nodes (21): en, id, TRIAL_COPY, TrialCopy, shape(), TRIAL_MAX_DAYS, TRIAL_MIN_DAYS, BUILDING_SIZES (+13 more)

### Community 111 - "Community 111"
Cohesion: 0.13
Nodes (16): data, ClosureMarkData, closureMarks(), knownClosures(), base, closure(), snapshot, useClosureMap() (+8 more)

### Community 112 - "Community 112"
Cohesion: 0.08
Nodes (24): dependencies, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+16 more)

### Community 113 - "Community 113"
Cohesion: 0.17
Nodes (19): channel(), contrastRatio(), parseHex(), readableTextOn(), relativeLuminance(), WCAG_AA_TEXT, WCAG_AA_UI, applyBranding() (+11 more)

### Community 114 - "Community 114"
Cohesion: 0.12
Nodes (15): public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), public.publish_begin(), public.publish_commit(), public.acquire_edit_lock() (+7 more)

### Community 115 - "Community 115"
Cohesion: 0.25
Nodes (19): along(), anchored(), cross(), crossing(), EMPTY_PATCH, GraphChange, lerp(), nearestNode() (+11 more)

### Community 116 - "Community 116"
Cohesion: 0.21
Nodes (19): DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds(), routeViewOn(), shownFloorOf(), stepTexts() (+11 more)

### Community 117 - "Community 117"
Cohesion: 0.19
Nodes (18): useVisitorTour(), BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap() (+10 more)

### Community 118 - "Community 118"
Cohesion: 0.16
Nodes (16): graphQuery(), loadSnapshot(), loadSnapshotWithGraph(), snapshotKey(), useRouteSnapshot(), Prefetch, PrefetchHolder, take() (+8 more)

### Community 119 - "Community 119"
Cohesion: 0.15
Nodes (6): _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 120 - "Community 120"
Cohesion: 0.14
Nodes (21): LocationPageFilters, expected(), newDb(), NO_FILTERS, signIn(), CategoryKey, createLargeVenue(), Db (+13 more)

### Community 121 - "Community 121"
Cohesion: 0.17
Nodes (9): perfEnv, Violation, median(), MID_RANGE_CPU, NETWORK, record(), seeded(), SeededVenue (+1 more)

### Community 122 - "Community 122"
Cohesion: 0.15
Nodes (18): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+10 more)

### Community 123 - "Community 123"
Cohesion: 0.25
Nodes (18): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+10 more)

### Community 124 - "Community 124"
Cohesion: 0.19
Nodes (19): matchToken(), normalizeSearchText(), plainWords(), PreparedSearchEntry, prepareSearch(), queryTokens(), scoreEntry(), searchEntries() (+11 more)

### Community 125 - "Community 125"
Cohesion: 0.10
Nodes (21): @axe-core/playwright, devDependencies, @axe-core/playwright@catalog:, @biomejs/biome@catalog:, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, @types/node@catalog:, typescript@catalog: (+13 more)

### Community 126 - "Community 126"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 127 - "Community 127"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 128 - "Community 128"
Cohesion: 0.12
Nodes (14): public.edit_locks, app.floor_writable(), public.release_edit_lock(), public.take_over_edit_lock(), public.take_over_edit_lock(), app.can_write_floor(), app.can_write_location(), app.can_write_location_type() (+6 more)

### Community 129 - "Community 129"
Cohesion: 0.19
Nodes (16): others, TimezoneSelect(), passwordKey, settingsKey, useSaveSystemSettings(), useSendTestEmail(), useSmtpPasswordIsSet(), useSystemSettings() (+8 more)

### Community 130 - "Community 130"
Cohesion: 0.18
Nodes (16): Closures(), FILTERS, isState(), STATES, STATUS, flushEditor(), useClosureMutations(), useClosureNetwork() (+8 more)

### Community 131 - "Community 131"
Cohesion: 0.14
Nodes (13): PhoneState, ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paths (+5 more)

### Community 132 - "Community 132"
Cohesion: 0.10
Nodes (19): runs-on, steps, concurrency, cancel-in-progress, group, jobs, check, name (+11 more)

### Community 133 - "Community 133"
Cohesion: 0.11
Nodes (19): @types/geojson@catalog:, @types/geojson, devDependencies, @biomejs/biome@catalog:, @types/geojson@catalog:, typescript@catalog:, vitest@catalog:, exports (+11 more)

### Community 134 - "Community 134"
Cohesion: 0.22
Nodes (18): BasemapUrlProblem, checkBasemapTileUrl(), escapeAttribution(), LOCAL_HOSTS, ParsedUrl, installation(), num(), numOrNull() (+10 more)

### Community 135 - "Community 135"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+11 more)

### Community 136 - "Community 136"
Cohesion: 0.16
Nodes (17): count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), CHANGE_GROUPS, changeCount() (+9 more)

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
Cohesion: 0.20
Nodes (6): Entry, GraphChangesInput, GraphSaveQueue, GraphSaveQueueOptions, toChanges(), NavNode

### Community 142 - "Community 142"
Cohesion: 0.13
Nodes (4): EditorState, Direction, EditorTool, GraphVisibility

### Community 143 - "Community 143"
Cohesion: 0.20
Nodes (7): SaveState, SaveOp, SaveQueue, SaveQueueOptions, SaveStatus, deferred(), setup()

### Community 144 - "Community 144"
Cohesion: 0.17
Nodes (15): DEMO_URL, OUTCOMES, pending, RequestResult, requestTrial(), visitorUrl, Field(), Problems (+7 more)

### Community 145 - "Community 145"
Cohesion: 0.16
Nodes (12): SearchField(), failure, useMapAvailable(), useDebouncedValue(), SEARCH_DEBOUNCE_MS, SEARCH_RESULTS_ID, VenueSearch(), onKeyDown() (+4 more)

### Community 146 - "Community 146"
Cohesion: 0.12
Nodes (17): devDependencies, @biomejs/biome@catalog:, @indoor/data@workspace:*, @indoor/domain@workspace:*, @playwright/test@catalog:, @types/node@catalog:, typescript@catalog:, @playwright/test (+9 more)

### Community 147 - "Community 147"
Cohesion: 0.12
Nodes (17): @indoor/domain, dependencies, @indoor/domain@workspace:*, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports (+9 more)

### Community 148 - "Community 148"
Cohesion: 0.13
Nodes (17): @types/node, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, vite@catalog:, vitest@catalog:, exports, vite (+9 more)

### Community 149 - "Community 149"
Cohesion: 0.12
Nodes (17): bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, vitest (+9 more)

### Community 150 - "Community 150"
Cohesion: 0.21
Nodes (12): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+4 more)

### Community 151 - "Community 151"
Cohesion: 0.12
Nodes (17): condition, auth, storage, ADMIN_URL, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD (+9 more)

### Community 152 - "Community 152"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 153 - "Community 153"
Cohesion: 0.19
Nodes (12): ComponentSummary, ConnectorLinks, graphComponents(), isolatedNodeIds(), NO_OTHERS, smallestId(), summarizeComponents(), unionFind() (+4 more)

### Community 154 - "Community 154"
Cohesion: 0.19
Nodes (15): applyGraphPatch(), edgeLengthM(), apply(), BASE, degree(), draw(), edgeList(), EMPTY (+7 more)

### Community 155 - "Community 155"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 156 - "Community 156"
Cohesion: 0.16
Nodes (11): BrandMarkProps, Part, SYMBOL_PARTS, LOGO_HEIGHT, LOGO_WIDTH, SYMBOL_BLUE, SYMBOL_WIDTH, SYMBOL_YELLOW (+3 more)

### Community 157 - "Community 157"
Cohesion: 0.21
Nodes (8): contrastOn(), enableAutoTours(), luminance(), resetTourProgress(), TourPopover, tourProgress(), openVenue(), PHONE_EN

### Community 158 - "Community 158"
Cohesion: 0.17
Nodes (11): app.enforce_publish_per_day(), app.enforce_quota(), app.enforce_storage_quota(), app.license_is_trial(), features_quota, locations_quota, objects_license_quota, origin_points_quota (+3 more)

### Community 160 - "Community 160"
Cohesion: 0.15
Nodes (13): depends_on, image, restart, condition, aliases, db, depends_on, image (+5 more)

### Community 161 - "Community 161"
Cohesion: 0.15
Nodes (13): ADMIN_DOMAIN, API_DOMAIN, PANDUARAH_ANON_KEY, PANDUARAH_API_URL, TLS_DIRECTIVE, VISITOR_DOMAIN, web, depends_on (+5 more)

### Community 162 - "Community 162"
Cohesion: 0.15
Nodes (13): ANON_KEY, AUTH_JWT_SECRET, DATABASE_URL, ENABLE_IMAGE_TRANSFORMATION, FILE_SIZE_LIMIT, FILE_STORAGE_BACKEND_PATH, GLOBAL_S3_BUCKET, POSTGREST_URL (+5 more)

### Community 163 - "Community 163"
Cohesion: 0.22
Nodes (10): hhmm(), isOpenAt(), localParts(), minutes(), OpeningHours, OpeningHoursProblem, OpeningSpan, shiftDate() (+2 more)

### Community 164 - "Community 164"
Cohesion: 0.15
Nodes (10): eastGf, facilities, index, [main, east], mainGf, mainL1, mainL2, outdoor (+2 more)

### Community 165 - "Community 165"
Cohesion: 0.17
Nodes (8): dependencies, @indoor/domain@workspace:*, maplibre-gl@catalog:, terra-draw@catalog:, terra-draw-maplibre-gl-adapter@catalog:, PolygonDrawer, terra-draw, terra-draw-maplibre-gl-adapter

### Community 166 - "Community 166"
Cohesion: 0.15
Nodes (8): connectors, edges, graph, hall, nodes, now, options, square

### Community 167 - "Community 167"
Cohesion: 0.17
Nodes (12): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, depends_on (+4 more)

### Community 168 - "Community 168"
Cohesion: 0.24
Nodes (3): ConversionError, render_svg(), RenderTest

### Community 169 - "Community 169"
Cohesion: 0.21
Nodes (10): EntranceFeature, BASE, corridor, EMPTY, FEATURES, m(), near(), point() (+2 more)

### Community 170 - "Community 170"
Cohesion: 0.17
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 171 - "Community 171"
Cohesion: 0.20
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 172 - "Community 172"
Cohesion: 0.18
Nodes (6): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT

### Community 173 - "Community 173"
Cohesion: 0.18
Nodes (6): DYNAMIC_PREFIXES, flatten(), languages, sources, Tree, usedKeys

### Community 174 - "Community 174"
Cohesion: 0.18
Nodes (10): image, restart, name, services, cad, volumes, caddy-config, caddy-data (+2 more)

### Community 175 - "Community 175"
Cohesion: 0.20
Nodes (7): anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 176 - "Community 176"
Cohesion: 0.29
Nodes (8): app.backup_runs, app.health_alerts, app.health_backup_result(), app.health_conditions(), app.notify_super_admins(), app.server_health, backup_runs_finished_idx, public.system_health()

### Community 177 - "Community 177"
Cohesion: 0.33
Nodes (6): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText()

### Community 178 - "Community 178"
Cohesion: 0.22
Nodes (10): environment, ALLOWED_ORIGINS, JWT_SECRET, LICENSE_VENDOR_URL, SEND_EMAIL_HOOK_SECRET, SUPABASE_ANON_KEY, SUPABASE_DB_URL, SUPABASE_SERVICE_ROLE_KEY (+2 more)

### Community 179 - "Community 179"
Cohesion: 0.29
Nodes (8): ConnectorInput, ConnectorRow, createConnectorsRepository(), isDirection(), isKind(), mapConnectorRow(), row, ConnectorDraft

### Community 180 - "Community 180"
Cohesion: 0.36
Nodes (9): FeatureParts, featureTarget(), infoPointTarget(), LocationParts, locationTarget(), originPointTarget(), placeTarget(), representativePoint() (+1 more)

### Community 181 - "Community 181"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 183 - "Community 183"
Cohesion: 0.22
Nodes (9): command, environment, image, restart, volumes, PGPORT, POSTGRES_DB, POSTGRES_PASSWORD (+1 more)

### Community 184 - "Community 184"
Cohesion: 0.22
Nodes (3): baseline, pg_temp.current(), pg_temp.requests()

### Community 185 - "Community 185"
Cohesion: 0.25
Nodes (8): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, vite, vitest

### Community 186 - "Community 186"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../tsconfig.base.json

### Community 187 - "Community 187"
Cohesion: 0.36
Nodes (3): license_of(), license_text(), main()

### Community 188 - "Community 188"
Cohesion: 0.29
Nodes (6): ALL, capture(), MENUS, shot(), SUPER_ADMIN_ONLY, WITHOUT_ADMIN_ONLY

### Community 189 - "Community 189"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 190 - "Community 190"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 191 - "Community 191"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 192 - "Community 192"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 194 - "Community 194"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 195 - "Community 195"
Cohesion: 0.29
Nodes (7): rest, condition, storage, depends_on, image, restart, volumes

### Community 196 - "Community 196"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 197 - "Community 197"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 198 - "Community 198"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 199 - "Community 199"
Cohesion: 0.47
Nodes (5): FloorValidation, useFloorValidation(), MultiPolygon, issuesByFeature(), ValidationIssue

### Community 200 - "Community 200"
Cohesion: 0.47
Nodes (3): Demo(), DemoBoundary, DemoMap

### Community 201 - "Community 201"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

### Community 202 - "Community 202"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 203 - "Community 203"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 204 - "Community 204"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 205 - "Community 205"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 206 - "Community 206"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 207 - "Community 207"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 208 - "Community 208"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 209 - "Community 209"
Cohesion: 0.33
Nodes (5): vulnerabilities, expired_at, id, purls, statement

### Community 210 - "Community 210"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 211 - "Community 211"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 212 - "Community 212"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 213 - "Community 213"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

## Knowledge Gaps
- **5 isolated node(s):** `TARGETS`, `RFC-6238`, `RFC-2045`, `RFC-2387`, `RFC-4180`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2389 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-i18next` connect `Community 17` to `Community 0`, `Community 37`, `Community 75`, `Community 45`, `Community 13`, `Community 79`, `Community 16`, `Community 145`, `Community 117`, `Community 30`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `TARGETS`, `RFC-6238`, `RFC-2045` to the rest of the system?**
  _5 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04900295090762765 - nodes in this community are weakly interconnected._
- **Why does `VenueId` connect `Community 14` to `Community 0`, `Community 1`, `Community 130`, `Community 3`, `Community 4`, `Community 2`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 12`, `Community 141`, `Community 13`, `Community 22`, `Community 26`, `Community 30`, `Community 34`, `Community 39`, `Community 40`, `Community 41`, `Community 43`, `Community 45`, `Community 48`, `Community 49`, `Community 51`, `Community 179`, `Community 59`, `Community 62`, `Community 65`, `Community 70`, `Community 71`, `Community 74`, `Community 88`, `Community 93`, `Community 102`, `Community 111`, `Community 118`, `Community 120`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.027363750142223232 - nodes in this community are weakly interconnected._
- **Why does `maplibre-gl` connect `Community 77` to `Community 133`, `Community 165`, `Community 46`, `Community 15`, `Community 21`, `Community 87`, `Community 23`, `Community 25`, `Community 29`, `Community 30`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.02979016167870657 - nodes in this community are weakly interconnected._