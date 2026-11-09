# Graph Report - indoor-map  (2026-11-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 8024 nodes · 25417 edges · 294 communities (222 shown, 72 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 383 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0eea8030`
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
- Community 227
- Community 229
- Community 231
- Community 232
- Community 233
- Community 237
- Community 240
- Community 241
- Community 242
- Community 243
- Community 244
- Community 245
- Community 246
- Community 250

## God Nodes (most connected - your core abstractions)
1. `Button()` - 260 edges
2. `VenueId` - 192 edges
3. `cn()` - 144 edges
4. `Input()` - 111 edges
5. `test` - 106 edges
6. `createRepositories()` - 96 edges
7. `toDataError()` - 89 edges
8. `DataError` - 84 edges
9. `FormNotice()` - 81 edges
10. `Skeleton()` - 69 edges

## Surprising Connections (you probably didn't know these)
- `ClosureMarkData` --references--> `SnapshotPosition`  [EXTRACTED]
  apps/visitor/src/features/closures/closure-model.ts → packages/domain/src/snapshot.ts
- `FloorTarget` --references--> `BuildingId`  [EXTRACTED]
  apps/admin/src/features/venues/floors/queries.ts → packages/domain/src/ids.ts
- `Attempt` --references--> `DataClient`  [EXTRACTED]
  e2e/support/role-attempts.ts → packages/data/src/client.ts
- `OriginPointDraft` --references--> `Position`  [EXTRACTED]
  apps/admin/src/features/origin-points/queries.ts → packages/domain/src/geometry.ts
- `choose()` --indirect_call--> `locations()`  [INFERRED]
  apps/admin/src/features/import/import-dialog.tsx → tests/perf/src/large-venue.ts

## Import Cycles
- None detected.

## Communities (294 total, 72 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (81): RFC-6238, Database, auditCount(), createUser(), newDb(), signedIn(), signedInAal2(), newDb() (+73 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (101): ColorField(), isColorValue(), Field(), AliasField(), FormNotice(), ConnectorDialog(), FacilityIconPreview(), FacilityTypeDialog() (+93 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (27): linkUnitsToPath(), test, TEST_CENTER, unitSquare(), AdminShell, EditorPage, EditorTool, at() (+19 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (48): VenueSelection, PlaceSources, RouteSources, DataClient, ConnectorsRepository, DisplaySettingsRepository, FeaturesRepository, InfoPointsRepository (+40 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (84): drawKindLabel(), drawKindValue(), FEATURE_KIND_LABELS, OUTDOOR_SUBTYPE_LABELS, UNIT_STATUS_LABELS, CommitInput(), FacilityFields(), hasHeight() (+76 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (81): CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables, TablesInsert (+73 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (92): COLUMNS, date, DEMO_STATES, DemoState, FILTERS, FLOORS, NAMES, Room (+84 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (86): loadCrowd(), crowdAreas(), useCrowdMap(), SnapshotNodeRole, areaSpots(), arrive(), between(), blankPerson() (+78 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (70): EntityIcon(), ListRow(), FacilityDetail(), Missing(), UnitDetail(), FieldValue(), LocationProfile(), Places() (+62 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (70): ClosureDialog(), ClosureForm(), NO_CLOSURES, useClosureDialog, ClosurePlaces, fromVenueInput(), impactText(), offsetMs() (+62 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (72): MapFeatureProperties, MapLabel, DEFAULT_FILL, DEFAULT_HEIGHTS, DEFAULT_OUTLINE, MAP_BACKGROUND, OUTDOOR_SUBTYPE_FILL, POINT_COLOR (+64 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (69): currentProfileKey, useCurrentProfile(), DataTableGallery(), HomeRedirect(), INSTALLATION_MODULES, ModulePage(), ModuleRoute(), PlaceholderPage() (+61 more)

### Community 12 - "Community 12"
Cohesion: 0.04
Nodes (51): TestRouteState, SheetSnap, RouteGraphStatus, closure(), featureName(), featurePosition(), featureView(), originView() (+43 more)

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (33): env, envFile, createHostedTrial(), endHostedTrial(), HostedTrialUser, removeHostedTrial(), currentLicenseId(), DEV_KEY (+25 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (65): PanelMessage(), useMediaQuery(), Brand(), DESKTOP_QUERY, Logo(), MapArea(), MOBILE_HEADER_PX, VisitorShell() (+57 more)

### Community 15 - "Community 15"
Cohesion: 0.05
Nodes (65): createAuthRepository(), signOut(), createRepositories(), isNetworkFailure(), readString(), toDataError(), fromFunctionError(), FUNCTION_KINDS (+57 more)

### Community 16 - "Community 16"
Cohesion: 0.04
Nodes (51): DataClientConfig, listPage(), Page, PAGE_SIZE, PageQuery, pageRange(), PageResponse, AliasesRepository (+43 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (61): useAuthSync(), RequireAuth(), initialAuthRedirectHash, AuthLayout(), ForgotPasswordPage(), ACTIVITY_EVENTS, clearActivity(), markActivity() (+53 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (44): AccountMenu(), STEPS, count, ISSUE_TITLES, ValidationSummary(), PictogramPicker(), useExportUserData(), saveJson() (+36 more)

### Community 19 - "Community 19"
Cohesion: 0.04
Nodes (52): FormPlace, BUILDINGS, FLOORS, g, venueId, accessible, context, floors (+44 more)

### Community 20 - "Community 20"
Cohesion: 0.04
Nodes (50): Geometry, COORDINATE_DECIMALS, createFeatureEditor(), onClick(), drawStyles(), EditableFeature, editableFlags(), FeatureEditor (+42 more)

### Community 21 - "Community 21"
Cohesion: 0.07
Nodes (65): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+57 more)

### Community 22 - "Community 22"
Cohesion: 0.05
Nodes (23): VisitorPage, createVariedVenues(), specs(), capture(), shot(), shot(), visitorSearch(), TILE_PNG (+15 more)

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (72): InsertedVenue, OpeningHours, PREVIEW_SNAPSHOT, PreviewSnapshotMessage, INSTRUCTION_ACTIONS, BuildingSchema, FeatureSchema, FloorSchema (+64 more)

### Community 24 - "Community 24"
Cohesion: 0.04
Nodes (53): mapCategoryRow(), FieldRow, LocationTypesRepository, mapFieldRow(), mapLocationTypeRow(), toFieldRow(), TypeRow, customFieldsOf() (+45 more)

### Community 25 - "Community 25"
Cohesion: 0.06
Nodes (68): signedLicense(), paidLicense(), canonicalize(), fromBase64(), isCount(), isDate(), isText(), Json (+60 more)

### Community 26 - "Community 26"
Cohesion: 0.07
Nodes (66): Can(), GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), AdminTourButton(), LABELS, seenKey (+58 more)

### Community 27 - "Community 27"
Cohesion: 0.08
Nodes (59): DemoRouteOptions, CameraPadding, fitBearing(), focusCamera(), InitialCamera, initialCamera(), MAP_GAP_PX, moveCamera() (+51 more)

### Community 28 - "Community 28"
Cohesion: 0.06
Nodes (51): FOCUS_MIN_ZOOM, focusFeature(), focusZoom(), geometryBounds(), getCamera(), prefersReducedMotion(), Corners, attributed (+43 more)

### Community 29 - "Community 29"
Cohesion: 0.07
Nodes (49): Editor(), footprintCenter(), useActivePlan(), useStepFloor(), EditorSidebar(), ListTab, OUTDOOR, EntranceField() (+41 more)

### Community 30 - "Community 30"
Cohesion: 0.04
Nodes (68): @indoor/third-party-notices@workspace:*, tailwindcss@catalog:, @tailwindcss/vite@catalog:, @types/react-dom@catalog:, @vitejs/plugin-react@catalog:, @indoor/third-party-notices, tailwindcss, @tailwindcss/vite (+60 more)

### Community 31 - "Community 31"
Cohesion: 0.10
Nodes (53): others, TimezoneSelect(), VenuePicker(), MODULE_NAV, ModuleNav, ROLE_LABELS, AREA_KINDS, targetKey() (+45 more)

### Community 32 - "Community 32"
Cohesion: 0.12
Nodes (25): SnapshotPosition, CONTEXT, VENUES, airportVenue(), dailyHours(), stableUuid(), VenueBuilder, campusVenue() (+17 more)

### Community 33 - "Community 33"
Cohesion: 0.05
Nodes (47): move(), first(), LOCATION_FILTER, toLocationPageFilters(), CategoriesRepository, CategoryWithUsage, removeFile(), facilityTypeInUseMessage() (+39 more)

### Community 34 - "Community 34"
Cohesion: 0.04
Nodes (41): app.user_role(), audit_events_occurred_idx, public.audit_events, public.profiles, public.system_settings, app.hook_password_verification_attempt(), public.public_visitor_url(), app.hook_password_verification_attempt() (+33 more)

### Community 35 - "Community 35"
Cohesion: 0.07
Nodes (55): areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, checkPolygon(), duplicateCodeIssues(), GEOMETRY_ISSUE_CODES, GeometryIssueCode (+47 more)

### Community 36 - "Community 36"
Cohesion: 0.08
Nodes (56): commit(), Calibration(), GeoreferencePanel(), resize(), meters, NumberField(), commit(), parseDecimal() (+48 more)

### Community 37 - "Community 37"
Cohesion: 0.06
Nodes (51): copy(), BPM, Copy, COPY, EN, ID, SCENES, assets (+43 more)

### Community 38 - "Community 38"
Cohesion: 0.09
Nodes (45): HOSTED_TRIAL_DAYS, NoticeEmail, renderAccountNotice(), AuthEmail, compose(), Params, renderAuthEmail(), BRAND_LOGO (+37 more)

### Community 39 - "Community 39"
Cohesion: 0.09
Nodes (51): ContrastTable(), readToken(), SURFACES, TEXT_PAIRS, TOKENS, UiGalleryPage(), BUILDING_SIZES, BUILDING_TYPES (+43 more)

### Community 40 - "Community 40"
Cohesion: 0.06
Nodes (42): app.check_edge_same_floor(), app.on_venue_created(), app.release_units_on_permanent_close(), app.touch_updated_at(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx, features_geom_idx (+34 more)

### Community 41 - "Community 41"
Cohesion: 0.05
Nodes (52): devDependencies, @biomejs/biome@catalog:, @indoor/data@workspace:*, @indoor/domain@workspace:*, @types/node@catalog:, typescript@catalog:, name, private (+44 more)

### Community 42 - "Community 42"
Cohesion: 0.08
Nodes (39): data, useVenueSelection, venuesKey, aliasesKey(), PROBLEM_MESSAGES, useAliasDraft(), facilityTypesKey(), useRemoveFacilityType() (+31 more)

### Community 43 - "Community 43"
Cohesion: 0.06
Nodes (39): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+31 more)

### Community 44 - "Community 44"
Cohesion: 0.07
Nodes (38): createGraphInteractions(), onMove(), onUp(), preview(), snapped(), GraphInteractionOptions, GraphNodeDrag, EMPTY (+30 more)

### Community 45 - "Community 45"
Cohesion: 0.08
Nodes (42): BrandingFormErrors, BrandingFormValues, ColorNote, colorNotes(), MESSAGES, ratio, empty, toBrandingFormValues() (+34 more)

### Community 46 - "Community 46"
Cohesion: 0.08
Nodes (42): VenueSpec, dependencies, zod@catalog:, vitest@catalog:, exports, ./fixtures/*, ./license, ./license-public-key (+34 more)

### Community 47 - "Community 47"
Cohesion: 0.08
Nodes (39): applyEntitlements(), enabledFeatures(), FEATURE_LABELS, PAID_FEATURES, EMPTY_SNAPSHOT_GRAPH, snapshotGraphPath(), splitSnapshot(), hasBlockingFindings() (+31 more)

### Community 48 - "Community 48"
Cohesion: 0.08
Nodes (29): submit(), ACCOUNTS, Fixtures, FOOTPRINT, PublishedVenue, TestVenue, globalSetup(), Attempt (+21 more)

### Community 49 - "Community 49"
Cohesion: 0.07
Nodes (35): RFC-2045, RFC-2387, accepted(), claim(), logError(), NoticeRow, release(), text() (+27 more)

### Community 50 - "Community 50"
Cohesion: 0.08
Nodes (39): EULA_VERSION, isEulaVersion(), needsEulaAcceptance(), importLicensePublicKey(), LicenseRejection, InviteInput, inviteScope(), Role (+31 more)

### Community 51 - "Community 51"
Cohesion: 0.08
Nodes (41): AIRLINES, FOOD, RETAIL, BuildingSpec, BuiltBuilding, BuiltFloor, FloorSpec, FloorUnit (+33 more)

### Community 52 - "Community 52"
Cohesion: 0.05
Nodes (31): app.trial_venue(), hosting.trials, app.can_write_floor(), app.can_write_location(), app.can_write_location_type(), app.reject_locked_venue(), app.venue_locked(), app.writable_venue_ids() (+23 more)

### Community 53 - "Community 53"
Cohesion: 0.05
Nodes (47): lucide-react@catalog:, @types/react@catalog:, lucide-react, @types/react, @types/react@catalog:, @types/react@catalog:, lucide-react@catalog:, @types/react@catalog: (+39 more)

### Community 54 - "Community 54"
Cohesion: 0.06
Nodes (26): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+18 more)

### Community 55 - "Community 55"
Cohesion: 0.06
Nodes (40): DirectoryFilterOptions, DirectoryGroup, directoryGroups(), directoryLetter(), directoryLocations(), matchesPlace(), NO_DIRECTORY_FILTER, OUTDOOR_FILTER (+32 more)

### Community 56 - "Community 56"
Cohesion: 0.11
Nodes (40): floorLabel(), useVenueFloors(), InfoPointDialogTarget, InfoPointsPanel(), MODE_FILTER, modeOf(), MODES, number (+32 more)

### Community 57 - "Community 57"
Cohesion: 0.09
Nodes (42): CustomFieldInputs(), DAYS, DEFAULT_SPAN, HoursEditor(), Spans(), codeMessage(), NAME_MESSAGES, placeText() (+34 more)

### Community 58 - "Community 58"
Cohesion: 0.10
Nodes (37): submit(), aStar(), Goal, MinHeap, SearchOptions, SearchResult, Seed, directCost() (+29 more)

### Community 59 - "Community 59"
Cohesion: 0.10
Nodes (39): DisplayFormErrors, DisplayFormValues, HEIGHT_MESSAGES, number, settings, toFormValues(), toPatch(), validate() (+31 more)

### Community 60 - "Community 60"
Cohesion: 0.11
Nodes (36): crowdAreas(), floorCollection(), iconSpecs(), cache, DemoMap(), DemoVenue, snapshotOf(), SNAPSHOTS (+28 more)

### Community 61 - "Community 61"
Cohesion: 0.05
Nodes (43): @indoor/map-core@workspace:*, @indoor/ui@workspace:*, react-dom@catalog:, @indoor/map-core, @indoor/ui, react-dom, dependencies, @indoor/domain@workspace:* (+35 more)

### Community 62 - "Community 62"
Cohesion: 0.10
Nodes (34): BrandGallery(), Section(), AppLayout(), NarrowScreenNotice(), subscribe(), NavItem(), Sidebar(), SidebarState (+26 more)

### Community 63 - "Community 63"
Cohesion: 0.08
Nodes (36): downloadCsvTemplate(), downloadXlsxTemplate(), save(), slug(), columnIndex(), columnName(), escapeXml(), firstSheetPath() (+28 more)

### Community 64 - "Community 64"
Cohesion: 0.09
Nodes (29): rootElement, router, App(), Gate, gateKey, readGate(), AuthShell(), errorText() (+21 more)

### Community 65 - "Community 65"
Cohesion: 0.06
Nodes (15): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, AuthRepository, EMAIL_UNAVAILABLE_PREFIXES (+7 more)

### Community 66 - "Community 66"
Cohesion: 0.11
Nodes (37): SnapshotNavNode, IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings(), byFloor() (+29 more)

### Community 67 - "Community 67"
Cohesion: 0.08
Nodes (18): appServers, args, CI, projectArgs, capture(), shot(), shot(), visitorLabel() (+10 more)

### Community 68 - "Community 68"
Cohesion: 0.10
Nodes (26): SnapshotGraph, ARC_ACCESSIBLE, ARC_CONNECTOR, ArcDraft, ConnectorArcs, nodeDistanceM(), connectorAllows(), connectorArcs() (+18 more)

### Community 69 - "Community 69"
Cohesion: 0.07
Nodes (27): licenses_one_current, public.installation, public.licenses, app.license_active(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+19 more)

### Community 70 - "Community 70"
Cohesion: 0.10
Nodes (36): capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText(), floorGap() (+28 more)

### Community 71 - "Community 71"
Cohesion: 0.08
Nodes (14): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), capture(), shot(), checkTable(), IMPORT_HEADER (+6 more)

### Community 72 - "Community 72"
Cohesion: 0.10
Nodes (26): app.check_unit_single_location(), location_units_single_location, public.categories, public.facility_types, public.features, public.field_definitions, public.location_categories, public.location_types (+18 more)

### Community 73 - "Community 73"
Cohesion: 0.05
Nodes (41): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+33 more)

### Community 74 - "Community 74"
Cohesion: 0.14
Nodes (35): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, adminScreenRect(), coverZoom(), cursor(), cursorPath() (+27 more)

### Community 75 - "Community 75"
Cohesion: 0.08
Nodes (28): ClosedElements, closedElements(), ClosedElementsOptions, ClosureFeature, featureNodeIds(), polygonsOf(), ClosureImpact, closureImpact() (+20 more)

### Community 76 - "Community 76"
Cohesion: 0.06
Nodes (35): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+27 more)

### Community 77 - "Community 77"
Cohesion: 0.06
Nodes (38): dependencies, fflate@^0.8.3, @indoor/data@workspace:*, @indoor/domain@workspace:*, pdfjs-dist@catalog:, react@catalog:, react-router@catalog:, @tanstack/react-query@catalog: (+30 more)

### Community 78 - "Community 78"
Cohesion: 0.05
Nodes (38): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+30 more)

### Community 79 - "Community 79"
Cohesion: 0.09
Nodes (34): EDITOR_CAM, EditorState, PUBLISH_BUTTON, TOOLS, VALIDATE_BUTTON, ADMIN_H, ADMIN_W, Connector (+26 more)

### Community 80 - "Community 80"
Cohesion: 0.09
Nodes (32): FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, ACTION_ROLES, ADMIN_ACTIONS (+24 more)

### Community 81 - "Community 81"
Cohesion: 0.10
Nodes (24): A6_PT, contentStream(), fixed(), pdfString(), QrCard, qrCardPdf(), card, wrapText() (+16 more)

### Community 82 - "Community 82"
Cohesion: 0.10
Nodes (24): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, ensureStyle(), findTourTarget(), reducedMotion(), runTour(), TourEnd (+16 more)

### Community 83 - "Community 83"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 84 - "Community 84"
Cohesion: 0.13
Nodes (32): hasOpeningHours(), INFO_POINT_ZOOM, infoPointSnapshot(), buildSnapshot(), byId(), isColor(), isFieldValue(), isHeight() (+24 more)

### Community 85 - "Community 85"
Cohesion: 0.10
Nodes (22): public.buildings, public.floors, public.info_points, public.origin_points, public.venues, app.guard_outdoor_layer(), floors_guard_outdoor_layer, app.enforce_quota() (+14 more)

### Community 86 - "Community 86"
Cohesion: 0.10
Nodes (29): requestTrial(), en, id, TRIAL_COPY, TrialCopy, Field(), Problems, State (+21 more)

### Community 87 - "Community 87"
Cohesion: 0.10
Nodes (24): facility, index, snapshot, index, snapshot, at(), gzipBytes(), largeVenue() (+16 more)

### Community 88 - "Community 88"
Cohesion: 0.07
Nodes (28): facility, index, none, roundTrip(), snapshot, unitWithoutLocation, decodeDeepLink(), DEEP_LINK_COORDINATE_DECIMALS (+20 more)

### Community 89 - "Community 89"
Cohesion: 0.09
Nodes (20): public.edit_locks, public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), app.floor_writable(), public.release_edit_lock() (+12 more)

### Community 90 - "Community 90"
Cohesion: 0.10
Nodes (24): areaM2(), polygonAreaM2(), ringAreaM2(), EntranceSuggestion, LinearRingSchema, LineString, LineStringSchema, MultiPolygon (+16 more)

### Community 91 - "Community 91"
Cohesion: 0.10
Nodes (24): ACTION_ICONS, InstructionErrors, SAMPLE, SAMPLE_FLOOR, validateInstruction(), INSTRUCTION_ACTION_LABELS, SnapshotConnectorKind, instructionPlaceholders() (+16 more)

### Community 92 - "Community 92"
Cohesion: 0.06
Nodes (31): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+23 more)

### Community 93 - "Community 93"
Cohesion: 0.09
Nodes (26): areaFilter(), CLOSURE_COLOR, CLOSURE_LAYER_IDS, CLOSURE_SOURCE_ID, closureCollection(), closureLayers(), ClosureMarks, setClosureMarks() (+18 more)

### Community 94 - "Community 94"
Cohesion: 0.15
Nodes (28): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+20 more)

### Community 95 - "Community 95"
Cohesion: 0.10
Nodes (27): GraphLayer(), count, GraphLegend(), ITEMS, LegendStyle, Swatch(), VisibilityToggle(), ANCHOR_OWNERS (+19 more)

### Community 96 - "Community 96"
Cohesion: 0.07
Nodes (31): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+23 more)

### Community 97 - "Community 97"
Cohesion: 0.16
Nodes (29): addEntrance(), attachAt(), clamp01(), firstPosition(), inside(), LinkTargets, linkTargets(), nearestOnGraph() (+21 more)

### Community 98 - "Community 98"
Cohesion: 0.08
Nodes (30): @indoor/routing@workspace:*, @indoor/routing, @indoor/routing@workspace:*, @indoor/data@workspace:*, @indoor/data@workspace:*, @indoor/routing@workspace:*, @playwright/test@catalog:, @indoor/data (+22 more)

### Community 99 - "Community 99"
Cohesion: 0.11
Nodes (24): useNow(), stepFocus(), useTestRoutePlan(), FLOORS, unitIdOf(), RouteOptions, buildRouteGraph(), FloorRoute (+16 more)

### Community 100 - "Community 100"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 101 - "Community 101"
Cohesion: 0.24
Nodes (30): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+22 more)

### Community 102 - "Community 102"
Cohesion: 0.16
Nodes (25): inVenueTime(), ChangeSummary(), ActiveVersion(), kilobytes(), PublishButton(), VenuePublish(), activePublicationKey(), historyKey() (+17 more)

### Community 103 - "Community 103"
Cohesion: 0.13
Nodes (13): Entry, GraphChangesInput, GraphSaveQueue, GraphSaveQueueOptions, deferred(), setup(), venue, toChanges() (+5 more)

### Community 104 - "Community 104"
Cohesion: 0.09
Nodes (15): LicenseRepository, daysRemaining(), GRACE_DAYS, importTooLarge(), LicenseLimits, LicenseNotice, licenseNotice(), LIMIT_LABELS (+7 more)

### Community 105 - "Community 105"
Cohesion: 0.12
Nodes (24): BuildingType, slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, hoursRows(), point() (+16 more)

### Community 106 - "Community 106"
Cohesion: 0.08
Nodes (25): connector(), connectors, edge(), edges, escalatorDown, escalatorUp, gtColumns, gtDoor (+17 more)

### Community 107 - "Community 107"
Cohesion: 0.12
Nodes (26): ActionLimits(), CHECKIN_RESULTS, CheckInButton(), date, dateTime, LicenseContent(), OpenSourceNotice(), Summary() (+18 more)

### Community 108 - "Community 108"
Cohesion: 0.07
Nodes (28): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+20 more)

### Community 109 - "Community 109"
Cohesion: 0.13
Nodes (21): BASEMAP_MESSAGES, orNull(), SystemFormErrors, SystemFormValues, SystemTextField, base, toPatch(), URL_MESSAGES (+13 more)

### Community 110 - "Community 110"
Cohesion: 0.18
Nodes (25): canvasArea(), unitCorner(), drawPlan(), camera(), deskAndMonitor(), LOBBY, lobby(), MONITOR (+17 more)

### Community 111 - "Community 111"
Cohesion: 0.17
Nodes (21): home(), LanguageSwitch(), privacyPage(), SiteFooter(), SiteHeader(), useDocumentMeta(), PAGES, root (+13 more)

### Community 112 - "Community 112"
Cohesion: 0.08
Nodes (26): dependencies, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+18 more)

### Community 113 - "Community 113"
Cohesion: 0.09
Nodes (26): @types/geojson@catalog:, @types/geojson, dependencies, @indoor/domain@workspace:*, maplibre-gl@catalog:, terra-draw@catalog:, terra-draw-maplibre-gl-adapter@catalog:, devDependencies (+18 more)

### Community 114 - "Community 114"
Cohesion: 0.15
Nodes (23): distanceM(), haversineM(), EARTH_RADIUS_M, CONNECTOR_ACTIONS, connectorSteps(), INSTRUCTION_PLACEHOLDERS, InstructionPlaceholder, placeholderValue() (+15 more)

### Community 115 - "Community 115"
Cohesion: 0.25
Nodes (21): closestBetween(), along(), anchored(), cross(), crossing(), distance(), EMPTY_PATCH, GraphChange (+13 more)

### Community 116 - "Community 116"
Cohesion: 0.17
Nodes (22): at(), CATEGORY_ID, DENSE_FLOOR, FACILITY_TYPE_ID, floorFeatures(), FloorGraph, floorGraph(), floorName() (+14 more)

### Community 117 - "Community 117"
Cohesion: 0.14
Nodes (16): data, ClosureMarkData, closureMarks(), knownClosures(), base, snapshot, useClosureMap(), CLOSURE_REFRESH_MS (+8 more)

### Community 118 - "Community 118"
Cohesion: 0.14
Nodes (17): InvitedUser, inviteUser(), Mail, MailpitDetail, MailpitSummary, search(), waitForMail(), captureMail() (+9 more)

### Community 119 - "Community 119"
Cohesion: 0.22
Nodes (14): currentGraph(), GraphActions, useGraphActions(), setEdgeAccessible(), applyEntrances(), removeEntrancesOf(), Draft, sameEdge() (+6 more)

### Community 120 - "Community 120"
Cohesion: 0.13
Nodes (22): expected(), LocationPageFilters, expected(), newDb(), NO_FILTERS, signIn(), CategoryKey, createLargeVenue() (+14 more)

### Community 121 - "Community 121"
Cohesion: 0.12
Nodes (18): applyGraphPatch(), edgeLengthM(), apply(), BASE, degree(), draw(), edgeList(), EMPTY (+10 more)

### Community 122 - "Community 122"
Cohesion: 0.16
Nodes (21): matchToken(), plainWords(), PreparedSearchEntry, prepareSearch(), queryTokens(), scoreEntry(), searchEntries(), SearchMatch (+13 more)

### Community 123 - "Community 123"
Cohesion: 0.19
Nodes (18): useVisitorTour(), BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap() (+10 more)

### Community 124 - "Community 124"
Cohesion: 0.15
Nodes (6): _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 125 - "Community 125"
Cohesion: 0.16
Nodes (12): LoginPage, contrastOn(), enableAutoTours(), luminance(), resetTourProgress(), TourPopover, tourProgress(), openLocations() (+4 more)

### Community 126 - "Community 126"
Cohesion: 0.15
Nodes (18): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+10 more)

### Community 127 - "Community 127"
Cohesion: 0.25
Nodes (18): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+10 more)

### Community 128 - "Community 128"
Cohesion: 0.19
Nodes (20): canvas2d(), drawBadge(), drawGlyph(), drawPlaceholderGlyph(), FACILITY_ICON_COLORS, FACILITY_ICON_FALLBACK, FACILITY_ICON_PREFIX, fitContain() (+12 more)

### Community 129 - "Community 129"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 130 - "Community 130"
Cohesion: 0.14
Nodes (16): Providers(), NON_RETRYABLE, queryClient, BrandMarkProps, Part, SYMBOL_PARTS, LOGO_HEIGHT, LOGO_WIDTH (+8 more)

### Community 131 - "Community 131"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 132 - "Community 132"
Cohesion: 0.14
Nodes (14): RouteEnd, DEFAULT_INSTRUCTION_TEMPLATES, ENTRANCES, FeatureParts, featureTarget(), infoPointTarget(), LocationParts, locationTarget() (+6 more)

### Community 133 - "Community 133"
Cohesion: 0.14
Nodes (13): PhoneState, ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paths (+5 more)

### Community 134 - "Community 134"
Cohesion: 0.11
Nodes (14): repoRoot, settled(), sheet(), build, built, { chromium }, encoded, frameFile (+6 more)

### Community 135 - "Community 135"
Cohesion: 0.10
Nodes (19): runs-on, steps, concurrency, cancel-in-progress, group, jobs, check, name (+11 more)

### Community 136 - "Community 136"
Cohesion: 0.22
Nodes (18): BasemapUrlProblem, checkBasemapTileUrl(), escapeAttribution(), LOCAL_HOSTS, ParsedUrl, installation(), num(), numOrNull() (+10 more)

### Community 137 - "Community 137"
Cohesion: 0.16
Nodes (14): ComponentSummary, ConnectorLinks, graphComponents(), isolatedNodeIds(), NO_OTHERS, smallestId(), summarizeComponents(), unionFind() (+6 more)

### Community 138 - "Community 138"
Cohesion: 0.18
Nodes (16): [product, nodeModules], authorOf(), collectNotices(), ExtraNotice, label(), licenseOf(), Notice, NOTICES_FILE (+8 more)

### Community 139 - "Community 139"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+11 more)

### Community 140 - "Community 140"
Cohesion: 0.15
Nodes (15): FIELD_PROBLEM_MESSAGES, FIELD_TYPE_LABELS, checkCustomField(), CustomField, CustomFieldProblem, customFieldsSchema(), FIELD_LABEL_MAX, FIELD_TEXT_MAX (+7 more)

### Community 141 - "Community 141"
Cohesion: 0.16
Nodes (17): count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), CHANGE_GROUPS, changeCount() (+9 more)

### Community 142 - "Community 142"
Cohesion: 0.13
Nodes (10): BlockEntry, isStatus(), LifecycleRun, RequestRow, toLead(), VendorAccess, VenueIdSchema, COORDINATE_SYSTEM (+2 more)

### Community 143 - "Community 143"
Cohesion: 0.16
Nodes (16): drawRoute(), strokeRoute(), camera(), dataLoop(), devices(), K, LOOP, OUTLINE (+8 more)

### Community 144 - "Community 144"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 145 - "Community 145"
Cohesion: 0.12
Nodes (18): @indoor/domain, dependencies, @indoor/domain@workspace:*, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports (+10 more)

### Community 146 - "Community 146"
Cohesion: 0.11
Nodes (15): attr(), brandDir, { chromium }, emailWidth, logo, outputs, paths, pngs (+7 more)

### Community 147 - "Community 147"
Cohesion: 0.20
Nodes (7): SaveState, SaveOp, SaveQueue, SaveQueueOptions, SaveStatus, deferred(), setup()

### Community 148 - "Community 148"
Cohesion: 0.14
Nodes (12): app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, app.server_settings, app.sync_service(), app.hosting_mode() (+4 more)

### Community 149 - "Community 149"
Cohesion: 0.12
Nodes (17): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, exports, vite (+9 more)

### Community 150 - "Community 150"
Cohesion: 0.22
Nodes (12): ActivePlan(), PlanPreview(), CadLayers(), meters, UNIT_LABELS, Picked, UploadForm(), FloorPlanVersion (+4 more)

### Community 151 - "Community 151"
Cohesion: 0.14
Nodes (15): saveValid(), { chromium }, envFile, locationId(), OUT, require, rest(), root (+7 more)

### Community 152 - "Community 152"
Cohesion: 0.21
Nodes (12): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+4 more)

### Community 153 - "Community 153"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 154 - "Community 154"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 155 - "Community 155"
Cohesion: 0.15
Nodes (12): Demo(), DemoBoundary, DemoMap, DEMO_URL, OUTCOMES, pending, postVerify(), RequestResult (+4 more)

### Community 156 - "Community 156"
Cohesion: 0.12
Nodes (16): condition, auth, storage, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD, PGUSER (+8 more)

### Community 157 - "Community 157"
Cohesion: 0.21
Nodes (12): dc(), die(), fetch_images(), health_check(), health_once(), load_env(), migration_count(), psql_db() (+4 more)

### Community 158 - "Community 158"
Cohesion: 0.17
Nodes (11): app.enforce_publish_per_day(), app.enforce_quota(), app.enforce_storage_quota(), app.license_is_trial(), features_quota, locations_quota, objects_license_quota, origin_points_quota (+3 more)

### Community 160 - "Community 160"
Cohesion: 0.19
Nodes (11): Db, DEMO_USERS, demoClosures(), demoEmail(), DemoUser, hoursFromNow(), RELEASE_NOTES, seedDemoUsers() (+3 more)

### Community 161 - "Community 161"
Cohesion: 0.33
Nodes (14): addNoise(), addTone(), bass(), CHORDS, duckGain(), kick(), midi(), noiseSource() (+6 more)

### Community 162 - "Community 162"
Cohesion: 0.14
Nodes (4): app.enforce_quota(), app.quota_limit(), app.quota_venue(), venue_members_quota

### Community 163 - "Community 163"
Cohesion: 0.35
Nodes (3): page, thirdPartyNotices(), UI_FONT_NOTICES

### Community 164 - "Community 164"
Cohesion: 0.15
Nodes (13): depends_on, image, restart, condition, aliases, db, depends_on, image (+5 more)

### Community 165 - "Community 165"
Cohesion: 0.17
Nodes (13): environment, image, restart, ALLOWED_ORIGINS, JWT_SECRET, LICENSE_VENDOR_URL, SEND_EMAIL_HOOK_SECRET, SUPABASE_ANON_KEY (+5 more)

### Community 166 - "Community 166"
Cohesion: 0.15
Nodes (13): ADMIN_DOMAIN, API_DOMAIN, PANDUARAH_ANON_KEY, PANDUARAH_API_URL, TLS_DIRECTIVE, VISITOR_DOMAIN, web, depends_on (+5 more)

### Community 167 - "Community 167"
Cohesion: 0.15
Nodes (13): ANON_KEY, AUTH_JWT_SECRET, DATABASE_URL, ENABLE_IMAGE_TRANSFORMATION, FILE_SIZE_LIMIT, FILE_STORAGE_BACKEND_PATH, GLOBAL_S3_BUCKET, POSTGREST_URL (+5 more)

### Community 168 - "Community 168"
Cohesion: 0.31
Nodes (12): ask(), assert_env_version(), assert_own_hook_secret(), b64url(), check_prerequisites(), install_backup_schedule(), jwt(), main() (+4 more)

### Community 169 - "Community 169"
Cohesion: 0.26
Nodes (9): BuildingRow, FILTERS, FOOTPRINT, Open, key(), useRefresh(), useRemoveBuilding(), useSaveBuilding() (+1 more)

### Community 170 - "Community 170"
Cohesion: 0.23
Nodes (6): FALLBACK_CENTER, FootprintMap(), EDIT_COLORS, createPolygonDrawer(), PolygonDrawer, setReferenceShapes()

### Community 171 - "Community 171"
Cohesion: 0.17
Nodes (12): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, depends_on (+4 more)

### Community 172 - "Community 172"
Cohesion: 0.24
Nodes (3): ConversionError, render_svg(), RenderTest

### Community 173 - "Community 173"
Cohesion: 0.21
Nodes (10): EntranceFeature, BASE, corridor, EMPTY, FEATURES, m(), near(), point() (+2 more)

### Community 174 - "Community 174"
Cohesion: 0.17
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 175 - "Community 175"
Cohesion: 0.30
Nodes (8): gridGraph(), { performance }, distance(), graphCost(), random(), randomGraph(), RandomGraphOptions, referenceCost()

### Community 176 - "Community 176"
Cohesion: 0.20
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 177 - "Community 177"
Cohesion: 0.18
Nodes (7): CONNECTOR_KINDS, CONNECTOR_NAME_MAX, ConnectorFloor, ConnectorProblem, ESCALATOR_DIRECTIONS, GraphPatch, OriginSnap

### Community 178 - "Community 178"
Cohesion: 0.24
Nodes (8): AUDIT_LABELS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES, roleLabel(), SETTING_FIELDS, target

### Community 179 - "Community 179"
Cohesion: 0.18
Nodes (6): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT

### Community 180 - "Community 180"
Cohesion: 0.29
Nodes (9): SearchField(), useDebouncedValue(), openHit(), SEARCH_DEBOUNCE_MS, SEARCH_RESULTS_ID, VenueSearch(), onKeyDown(), submit() (+1 more)

### Community 181 - "Community 181"
Cohesion: 0.18
Nodes (6): DYNAMIC_PREFIXES, flatten(), languages, sources, Tree, usedKeys

### Community 182 - "Community 182"
Cohesion: 0.24
Nodes (8): AuditFilters, newDb(), signIn(), AUDIT_ACTIONS, AUDIT_LOG_LIMIT, AuditAction, AuditActionSchema, AuditPerson

### Community 183 - "Community 183"
Cohesion: 0.25
Nodes (8): ConnectorInput, ConnectorRow, isDirection(), isKind(), mapConnectorRow(), row, ConnectorDraft, FLOORS

### Community 184 - "Community 184"
Cohesion: 0.25
Nodes (8): hhmm(), isOpenAt(), localParts(), minutes(), OpeningHoursProblem, shiftDate(), spansOn(), office

### Community 185 - "Community 185"
Cohesion: 0.20
Nodes (7): anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 186 - "Community 186"
Cohesion: 0.33
Nodes (6): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText()

### Community 187 - "Community 187"
Cohesion: 0.20
Nodes (7): { chromium }, EMBLEMS, font, LOGOS, out, require, root

### Community 188 - "Community 188"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 190 - "Community 190"
Cohesion: 0.22
Nodes (9): command, environment, image, restart, volumes, PGPORT, POSTGRES_DB, POSTGRES_PASSWORD (+1 more)

### Community 191 - "Community 191"
Cohesion: 0.22
Nodes (3): baseline, pg_temp.current(), pg_temp.requests()

### Community 192 - "Community 192"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../tsconfig.base.json

### Community 193 - "Community 193"
Cohesion: 0.25
Nodes (7): name, services, volumes, caddy-config, caddy-data, db-data, storage-data

### Community 194 - "Community 194"
Cohesion: 0.36
Nodes (3): license_of(), license_text(), main()

### Community 195 - "Community 195"
Cohesion: 0.29
Nodes (4): json(), read(), results, root

### Community 196 - "Community 196"
Cohesion: 0.32
Nodes (5): drawUnit(), newDb(), PNG, signIn(), square()

### Community 197 - "Community 197"
Cohesion: 0.29
Nodes (6): EXTENSION_BY_MIME, ImageFileCheck, ImageFileProblem, ImageMime, MAX_IMAGE_BYTES, MIME_BY_EXTENSION

### Community 199 - "Community 199"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 200 - "Community 200"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 201 - "Community 201"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 202 - "Community 202"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 204 - "Community 204"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 205 - "Community 205"
Cohesion: 0.29
Nodes (7): rest, condition, storage, depends_on, image, restart, volumes

### Community 206 - "Community 206"
Cohesion: 0.33
Nodes (4): restore.sh script, rollback.sh script, rollback(), upgrade.sh script

### Community 207 - "Community 207"
Cohesion: 0.33
Nodes (5): ALL, capture(), MENUS, shot(), WITHOUT_ADMIN_ONLY

### Community 208 - "Community 208"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 209 - "Community 209"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 210 - "Community 210"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 211 - "Community 211"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

### Community 212 - "Community 212"
Cohesion: 0.47
Nodes (5): domainGraph(), filesIn(), functionsDir, root, specifiers()

### Community 213 - "Community 213"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 214 - "Community 214"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 215 - "Community 215"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 216 - "Community 216"
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
Nodes (5): compilerOptions, lib, types, extends, include

### Community 221 - "Community 221"
Cohesion: 0.33
Nodes (5): vulnerabilities, expired_at, id, purls, statement

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
Nodes (4): compilerOptions, types, extends, include

### Community 226 - "Community 226"
Cohesion: 0.60
Nodes (4): app.guard_last_super_admin(), app.log_profile_changes(), profiles_guard_last_super_admin, profiles_log_changes

## Knowledge Gaps
- **5 isolated node(s):** `RFC-6238`, `TARGETS`, `RFC-2045`, `RFC-2387`, `RFC-4180`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2358 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-i18next` connect `Community 8` to `Community 1`, `Community 27`, `Community 14`, `Community 82`, `Community 18`, `Community 21`, `Community 123`, `Community 61`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `RFC-6238`, `TARGETS`, `RFC-2045` to the rest of the system?**
  _5 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02826890420537409 - nodes in this community are weakly interconnected._
- **Why does `VenueId` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 9`, `Community 11`, `Community 12`, `Community 14`, `Community 142`, `Community 16`, `Community 19`, `Community 21`, `Community 24`, `Community 26`, `Community 29`, `Community 31`, `Community 160`, `Community 33`, `Community 39`, `Community 169`, `Community 42`, `Community 48`, `Community 54`, `Community 183`, `Community 56`, `Community 57`, `Community 59`, `Community 63`, `Community 196`, `Community 70`, `Community 88`, `Community 95`, `Community 97`, `Community 102`, `Community 103`, `Community 117`, `Community 120`, `Community 121`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07019527235354574 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `Community 41` to `Community 96`, `Community 98`, `Community 77`, `Community 46`, `Community 112`, `Community 113`, `Community 145`, `Community 53`, `Community 149`, `Community 61`, `Community 30`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.039096774193548386 - nodes in this community are weakly interconnected._