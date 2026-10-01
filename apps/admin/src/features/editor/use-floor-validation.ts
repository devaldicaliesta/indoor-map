import {
  issuesByFeature,
  type MultiPolygon,
  type Polygon,
  type ValidationIssue,
  validateFloorGeometry,
} from '@indoor/domain';
import { useDeferredValue, useMemo } from 'react';
import { featureList, useEditorStore } from './store/editor-store';

export interface FloorValidation {
  issues: ValidationIssue[];
  byFeature: ReadonlyMap<string, ValidationIssue[]>;
  featureIds: string[];
}

/**
 * Validasi geometri dijalankan ulang setiap kali isi lantai berubah (setiap
 * aksi yang disimpan). Memakai nilai tertunda agar menyunting tetap lancar di lantai besar.
 * Tidak pernah memblokir penyimpanan draft.
 */
export function useFloorValidation(boundary: Polygon | MultiPolygon | null): FloorValidation {
  const features = useDeferredValue(useEditorStore((s) => s.features));
  return useMemo(() => {
    const issues = validateFloorGeometry(featureList(features), { boundary });
    const byFeature = issuesByFeature(issues);
    return { issues, byFeature, featureIds: [...byFeature.keys()] };
  }, [features, boundary]);
}
