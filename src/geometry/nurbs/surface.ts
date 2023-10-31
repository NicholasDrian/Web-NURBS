import { mat4, Mat4, vec3, Vec3, vec4, Vec4 } from "wgpu-matrix";
import { MaterialName } from "../../materials/material";
import { BoundingBox } from "../boundingBox";
import { Geometry } from "../geometry";
import { Mesh } from "../mesh";
import { Ray } from "../ray";
import { Curve } from "./curve";
import { basisFuncs, span } from "./utils";




export class Surface extends Geometry {

  private mesh: Mesh | null;
  private edgeLowU: Curve | null;
  private edgeHighU: Curve | null;
  private edgeLowV: Curve | null;
  private edgeHighV: Curve | null;

  constructor(
    private weightedControlPoints: Vec4[][],
    private uKnots: number[],
    private vKnots: number[],
    private degreeU: number,
    private degreeV: number,
    parent: Geometry | null = null,
    model: Mat4 = mat4.identity(),
    material: MaterialName | null = null,
  ) {
    super(parent, model, material);
    this.mesh = null;
    this.edgeLowU = null;
    this.edgeHighU = null;
    this.edgeLowV = null;
    this.edgeHighV = null;
    this.update();
  }

  public delete(): void {
    this.mesh?.destroy();
    this.edgeLowU?.destroy();
    this.edgeHighU?.destroy();
    this.edgeLowV?.destroy();
    this.edgeHighV?.destroy();
  }

  public getBoundingBox(): BoundingBox {
    return this.mesh!.getBoundingBox();
  }

  public intersect(ray: Ray): number | null {
    // TODO: come back to this...
    throw new Error("not implemented");
  }

  private update(): void {
    this.delete();
    /*
      {
      int sampleCountU = NURBSUtils::SAMPLES_PER_EDGE * ((int)m_Points.size() - 1);
      int sampleCountV = NURBSUtils::SAMPLES_PER_EDGE * ((int)m_Points[0].size() - 1);
      float firstKnotU = m_KnotsU[0];
      float firstKnotV = m_KnotsV[0];
      float knotSizeU = m_KnotsU.back() - firstKnotU;
      float knotSizeV = m_KnotsV.back() - firstKnotV;
      float stepU = knotSizeU / sampleCountU;
      float stepV = knotSizeV / sampleCountV;
      m_Samples.resize((sampleCountU + 1) * (sampleCountV + 1));
      for (int i = 0; i <= sampleCountU; i++) 
        for (int j = 0; j <= sampleCountV; j++) 
          m_Samples[i * (sampleCountV + 1) + j] = Sample(firstKnotU + i * stepU, firstKnotV + j * stepV);
      m_Indices.clear();
      for (int i = 0; i < sampleCountU; i++) {
        for (int j = 0; j < sampleCountV; j++) {
          m_Indices.push_back(i * (sampleCountV + 1) + j);
          m_Indices.push_back(i * (sampleCountV + 1) + j + 1);
          m_Indices.push_back((i + 1) * (sampleCountV + 1) + j);
    
          m_Indices.push_back(i * (sampleCountV + 1) + j + 1);
          m_Indices.push_back((i + 1) * (sampleCountV + 1) + j + 1);
          m_Indices.push_back((i + 1) * (sampleCountV + 1) + j);
        }
      }
  
      */

    const sampleCountU: number = Curve.SAMPLES_PER_EDGE * (this.weightedControlPoints.length - 1);
    const sampleCountV: number = Curve.SAMPLES_PER_EDGE * (this.weightedControlPoints[0].length - 1);

    const firstKnotU: number = this.uKnots[0];
    const firstKnotV: number = this.vKnots[0];

    const knotSizeU: number = this.uKnots[this.uKnots.length - 1] - firstKnotU;
    const knotSizeV: number = this.vKnots[this.vKnots.length - 1] - firstKnotV;

    const stepU: number = knotSizeU / sampleCountU;
    const stepV: number = knotSizeV / sampleCountV;

    const meshVerts: Vec3[] = [];
    const meshNormals: Vec3[] = [];
    const meshIndices: number[] = [];

    for (let i = 0; i <= sampleCountU; i++) {
      for (let j = 0; j <= sampleCountV; j++) {
        meshVerts.push(this.sample(firstKnotU + i * stepU, firstKnotV + j * stepV));
      }
    }
    for (let i = 0; i < sampleCountU; i++) {
      for (let j = 0; j < sampleCountV; j++) {
        meshIndices.push(i * (sampleCountV + 1) + j);
        meshIndices.push(i * (sampleCountV + 1) + j + 1);
        meshIndices.push((i + 1) * (sampleCountV + 1) + j);
        meshIndices.push(i * (sampleCountV + 1) + j + 1);
        meshIndices.push((i + 1) * (sampleCountV + 1) + j + 1);
        meshIndices.push((i + 1) * (sampleCountV + 1) + j);
      }
    }
    for (let i = 0; i <= sampleCountU; i++) {
      for (let j = 0; j <= sampleCountV; j++) {
        const v1: Vec3 = (i == 0)
          ? vec3.sub(meshVerts[i * (sampleCountV + 1) + j], meshVerts[(i + 1) * (sampleCountV + 1) + j])
          : vec3.sub(meshVerts[i * (sampleCountV + 1) + j], meshVerts[(i - 1) * (sampleCountV + 1) + j]);
        const v2: Vec3 = (j == 0)
          ? vec3.sub(meshVerts[i * (sampleCountV + 1) + j], meshVerts[i * (sampleCountV + 1) + j + 1])
          : vec3.sub(meshVerts[i * (sampleCountV + 1) + j], meshVerts[i * (sampleCountV + 1) + j - 1]);
        var normal: Vec3 = vec3.normalize(vec3.cross(v1, v2));
        if (i == 0) normal = vec3.scale(normal, -1);
        if (j == 0) normal = vec3.scale(normal, -1);
        meshNormals.push(normal);
      }
    }
    console.log(meshVerts);

    this.mesh = new Mesh(this, meshVerts, meshNormals, meshIndices);
  }

  /*
    std::vector<glm::vec3> normals((sampleCountU + 1) * (sampleCountV + 1));
    for (int i = 0; i <= sampleCountU; i++) {
      for (int j = 0; j <= sampleCountV; j++) {
        glm::vec3 v1 = (i == 0) 
          ? (m_Samples[i * (sampleCountV + 1) + j] - m_Samples[(i + 1) * (sampleCountV + 1) + j])
          : (m_Samples[i * (sampleCountV + 1) + j] - m_Samples[(i - 1) * (sampleCountV + 1) + j]);
        glm::vec3 v2 = (j == 0)
          ? (m_Samples[i * (sampleCountV + 1) + j] - m_Samples[i * (sampleCountV + 1) + j + 1])
          : (m_Samples[i * (sampleCountV + 1) + j] - m_Samples[i * (sampleCountV + 1) + j - 1]);
        normals[i * (sampleCountV + 1) + j] = glm::normalize(glm::cross(v1, v2));
      }
    }
  
    glm::vec4 color{ 1.0,0.0,0.0,1.0 };
    m_VertexArray = std::make_unique<VertexArrayTriangles>(m_Samples, normals, color, m_Indices);
  }
  
  glm::vec3 NURBSurface::Sample(float u, float v) const
  {
    int USpan = NURBSUtils::Span(m_KnotsU, u, m_DegreeU);
    int VSpan = NURBSUtils::Span(m_KnotsV, v, m_DegreeV);
    std::vector<float> basisFuncsU = NURBSUtils::BasisFuncs(m_KnotsU, u, m_DegreeU);
    std::vector<float> basisFuncsV = NURBSUtils::BasisFuncs(m_KnotsV, v, m_DegreeV);
    glm::vec4 res = { 0.0f, 0.0f, 0.0f, 0.0f };
    for (int i = 0; i <= m_DegreeU; i++) {
      for (int j = 0; j <= m_DegreeV; j++) 
        res += m_Points[USpan - m_DegreeU + i][VSpan - m_DegreeV + j] * (basisFuncsV[j] * basisFuncsU[i]);
    }
    return glm::vec3{ res.x / res.w, res.y / res.w, res.z / res.w };
  }
  */

  public sample(u: number, v: number): Vec3 {
    const uSpan: number = span(this.uKnots, u, this.degreeU);
    const vSpan: number = span(this.vKnots, v, this.degreeV);
    const basisFuncsU: number[] = basisFuncs(this.uKnots, u, this.degreeU);
    const basisFuncsV: number[] = basisFuncs(this.vKnots, v, this.degreeV);
    var res: Vec4 = vec4.create(0, 0, 0, 0);
    for (let i = 0; i <= this.degreeU; i++) {
      for (let j = 0; j <= this.degreeV; j++) {
        res = vec4.add(res, vec4.scale(
          this.weightedControlPoints[uSpan - this.degreeU + i][vSpan - this.degreeV + j],
          basisFuncsV[j] * basisFuncsU[i]
        ));
      }
    }
    return vec3.create(res[0] / res[3], res[1] / res[3], res[2] / res[3]);
  }
}
